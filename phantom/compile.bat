git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp
clang++ -I. -O3 -mfma -mf16c -mavx -mavx2 -lwinpthread -std=c++11 -c whisper.cpp -o whisper.o
clang -I. -O3 -std=c11 -lwinpthread -c ggml.c -o ggml.o
clang -I. -O3 -std=c11 -lwinpthread -c ggml-alloc.c -o ggml-alloc.o
clang -I. -O3 -std=c11 -lwinpthread -c ggml-backend.c -o ggml-backend.o
clang -I. -O3 -std=c11 -lwinpthread -c ggml-quants.c -o ggml-quants.o
cd ..
clang++ -O3 -lwinpthread ./phantom.cpp ./whisper.cpp/examples/common.cpp -I./whipser.cpp -I./whisper.cpp/examples ./whisper.cpp/ggml.o ./whisper.cpp/whisper.o ./whisper.cpp/ggml-alloc.o ./whisper.cpp/ggml-backend.o ./whisper.cpp/ggml-quants.o -o phantom.exe
echo -static -static-libgcc -static-libstdc++ 