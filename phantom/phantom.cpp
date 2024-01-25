#include "./whisper.cpp/examples/common.h"
#include "./whisper.cpp/whisper.h"

void whisper_print_segment_callback(struct whisper_context * ctx, struct whisper_state *, int n_new, void * user_data) {
    const int n_segments = whisper_full_n_segments(ctx);
    int64_t t0 = 0;
    int64_t t1 = 0;

    for (int i = n_segments - n_new; i < n_segments; i++) {
		t0 = whisper_full_get_segment_t0(ctx, i);
		t1 = whisper_full_get_segment_t1(ctx, i);

		const char * text = whisper_full_get_segment_text(ctx, i);

		fprintf(stderr, "\n@PHANTOM.CUE: ||%d|%d||%s\n", (int)t0 * 10, (int)t1 * 10, text);
        fflush(stdout);
    }
}

int main() {
    fprintf(stderr, "@PHANTOM.VER: 0.0.9\n");
    struct whisper_context_params cparams;
    cparams.use_gpu = true;

    struct whisper_context * ctx = whisper_init_from_file_with_params("./phantom/models/default-model.bin", cparams);

    if (ctx == nullptr) {
        fprintf(stderr, "@PHANTOM.ERR: Whisper content init was failed\n");
        return 0;
    }

    std::vector<float> pcmf32;
    std::vector<std::vector<float>> pcmf32s;

    if(!read_wav("./phantom/__tmp_phantom.wav", pcmf32, pcmf32s, false)){
        fprintf(stderr, "@PHANTOM.ERR: Audio file was corrupted\n");
        return 0;
    }

    whisper_full_params wparams = whisper_full_default_params(WHISPER_SAMPLING_GREEDY);
    wparams.new_segment_callback = whisper_print_segment_callback;

    if (whisper_full_parallel(ctx, wparams, pcmf32.data(), pcmf32.size(), 4) != 0) {
        fprintf(stderr, "@PHANTOM.ERR: Audio process was failed\n");
        return 0;
    }

    whisper_free(ctx);
    return 0;
}