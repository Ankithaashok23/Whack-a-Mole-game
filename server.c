#include "mongoose.h"
#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <string.h>

#define MOLE_HOLES 9

// Difficulty levels
#define DIFFICULTY_EASY 1000    // mole spawn interval in ms
#define DIFFICULTY_MEDIUM 600
#define DIFFICULTY_HARD 300

// Game state: single active mole at a time
#define MOLES_PER_ROUND 1
int active_mole = -1; // index of currently visible mole
int score = 0;
int hits = 0;
int misses = 0;
int max_misses = 5;  // game ends when misses reach this
int difficulty = DIFFICULTY_MEDIUM;  // current difficulty (spawn interval in ms)
int is_paused = 0;  // 0 = playing, 1 = paused
long paused_time_left = 30000;  // time left in ms when paused
int is_first_play = 1;  // 1 if first time playing
int best_score = 0;  // best score achieved

// Badge system: 5 badges (0=false, 1=true)
// 0: Fast Player (10 hits in 5s), 1: Accuracy Star (90% accuracy), 2: Combo Master (3 combo),
// 3: Starter Badge (first play), 4: High Score (beat best)
int badges[5] = {0, 0, 0, 0, 0};
int combo_count = 0;  // current combo counter
long game_start_time = 0;  // timestamp when game started

static const char *s_listening_address = "http://0.0.0.0:8000";


// Helper: check if a position is already used
// helper not needed for single mole but keep simple function
int is_mole_at(int pos) {
    return (active_mole == pos) ? 1 : 0;
}

// Random mole spawning: one mole at a time
void spawn_mole() {
    active_mole = rand() % MOLE_HOLES;
}

// Handle HTTP requests
static void fn(struct mg_connection *c, int ev, void *ev_data) {
    if (ev == MG_EV_HTTP_MSG) {
        struct mg_http_message *hm = (struct mg_http_message *) ev_data;

        if (mg_match(hm->uri, mg_str("/reset"), NULL)) {
            // Reset all game state
            active_mole = -1;
            score = 0;
            hits = 0;
            misses = 0;
            combo_count = 0;
            is_paused = 0;
            paused_time_left = 30000;
            game_start_time = time(NULL);
            memset(badges, 0, sizeof(badges));
            if (is_first_play) {
                badges[3] = 1;  // Award starter badge on first play
                is_first_play = 0;
            }
            spawn_mole();
            mg_http_reply(c, 200, "Content-Type: text/plain\r\n", "reset");
        } else if (mg_match(hm->uri, mg_str("/game_state"), NULL)) {
            char response[512];
            int mole = -1;
            if (active_mole >= 0) mole = active_mole;
            snprintf(response, sizeof(response),
                     "{\"moles\": [%d], \"score\": %d, \"hits\": %d, \"misses\": %d, \"paused\": %d, \"difficulty\": %d, \"maxMisses\": %d, \"combo\": %d, \"badges\": [%d,%d,%d,%d,%d]}",
                     mole, score, hits, misses, is_paused, difficulty, max_misses, combo_count, badges[0], badges[1], badges[2], badges[3], badges[4]);
            mg_http_reply(c, 200, "Content-Type: application/json\r\n", "%s", response);
        } else if (mg_match(hm->uri, mg_str("/hit"), NULL)) {
            int hole;
            char body[100] = {0};
            int len = (hm->body.len < (sizeof(body) - 1)) ? hm->body.len : (sizeof(body) - 1);
            memcpy(body, hm->body.buf, len);
            body[len] = '\0';
            sscanf(body, "hole=%d", &hole);
            if (active_mole >= 0 && hole == active_mole) {
                score += 5;
                hits++;
                combo_count++;
                // Check for Combo Master badge (3 in a row)
                if (combo_count >= 3) {
                    badges[2] = 1;
                }
                // spawn a new random mole
                spawn_mole();
                mg_http_reply(c, 200, "", "hit");
            } else {
                misses++;
                combo_count = 0;  // reset combo on miss
                if (misses >= max_misses) {
                    active_mole = -1;  // end game
                    mg_http_reply(c, 200, "", "gameOver");
                } else {
                    mg_http_reply(c, 200, "", "miss");
                }
            }
        } else if (mg_match(hm->uri, mg_str("/set_difficulty"), NULL)) {
            char body[100] = {0};
            int len = (hm->body.len < (sizeof(body) - 1)) ? hm->body.len : (sizeof(body) - 1);
            memcpy(body, hm->body.buf, len);
            body[len] = '\0';
            char level[50];
            sscanf(body, "level=%49s", level);
            if (strcmp(level, "easy") == 0) {
                difficulty = DIFFICULTY_EASY;
            } else if (strcmp(level, "medium") == 0) {
                difficulty = DIFFICULTY_MEDIUM;
            } else if (strcmp(level, "hard") == 0) {
                difficulty = DIFFICULTY_HARD;
            }
            mg_http_reply(c, 200, "Content-Type: text/plain\r\n", "ok");
        } else if (mg_match(hm->uri, mg_str("/pause"), NULL)) {
            is_paused = 1;
            char body[100] = {0};
            int len = (hm->body.len < (sizeof(body) - 1)) ? hm->body.len : (sizeof(body) - 1);
            memcpy(body, hm->body.buf, len);
            body[len] = '\0';
            long time_left;
            sscanf(body, "timeLeft=%ld", &time_left);
            paused_time_left = time_left;
            mg_http_reply(c, 200, "Content-Type: text/plain\r\n", "paused");
        } else if (mg_match(hm->uri, mg_str("/resume"), NULL)) {
            is_paused = 0;
            mg_http_reply(c, 200, "Content-Type: text/plain\r\n", "resumed");
        } else if (mg_match(hm->uri, mg_str("/spawn"), NULL)) {
            // Spawn a new mole on demand (used by frontend to control spawn rate)
            if (!is_paused && misses < max_misses) {
                spawn_mole();
                mg_http_reply(c, 200, "Content-Type: text/plain\r\n", "ok");
            } else {
                mg_http_reply(c, 200, "Content-Type: text/plain\r\n", "paused_or_over");
            }
    } else {
            // Serve static files from the web directory
            struct mg_http_serve_opts opts = {0};
            opts.root_dir = "web";
            char path[256] = {0};
            if (mg_match(hm->uri, mg_str("/"), NULL)) {
                snprintf(path, sizeof(path), "web/index.html");
            } else {
                // Remove leading slash from URI and serve from web dir
                snprintf(path, sizeof(path), "web%.*s", (int)hm->uri.len, hm->uri.buf);
            }
            mg_http_serve_file(c, hm, path, &opts);
        }
    }
}

int main() {
    srand(time(NULL));
    struct mg_mgr mgr;
    mg_mgr_init(&mgr);
    struct mg_connection *lc = mg_http_listen(&mgr, s_listening_address, fn, &mgr);
    if (lc == NULL) {
        fprintf(stderr, "Failed to bind to %s\n", s_listening_address);
        mg_mgr_free(&mgr);
        return 1;
    }

    printf("Server running on %s\n", s_listening_address);
    spawn_mole();

    for (;;) mg_mgr_poll(&mgr, 1000);
    mg_mgr_free(&mgr);
    return 0;
}
