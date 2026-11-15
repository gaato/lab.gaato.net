# Media fixtures

These small, original test files exercise progressive MP4, QuickTime metadata,
B-frame composition offsets, AAC, HEVC rotation, and fragmented-MP4 rejection.
`vfr-jitter.mp4` is a silent 320×240 H.264 clip with alternating +4 ms
presentation jitter at about 30 fps and a 2.499989 s duration. It exercises exact
trim defaults and variable frame timing.

```sh
ffmpeg -f lavfi -i testsrc2=size=320x240:rate=30:duration=2 -f lavfi -i sine=frequency=440:sample_rate=44100:duration=2 -c:v libx264 -profile:v high -pix_fmt yuv420p -g 30 -bf 2 -b:v 200k -c:a aac -b:a 64k -ac 2 -movflags +faststart h264-aac.mp4
ffmpeg -f lavfi -i testsrc2=size=320x240:rate=30:duration=1 -c:v libx265 -tag:v hvc1 -pix_fmt yuv420p -b:v 150k -an h.mov
ffmpeg -display_rotation 90 -i h.mov -f lavfi -i sine=frequency=660:sample_rate=48000:duration=1 -c:v copy -c:a aac -b:a 48k -ac 1 -shortest hevc-rotated.mov
ffmpeg -f lavfi -i testsrc2=size=320x240:rate=30:duration=1 -c:v libx264 -pix_fmt yuv420p -b:v 100k -an -movflags +frag_keyframe+empty_moov fragmented.mp4
ffmpeg -f lavfi -i "testsrc2=size=320x240:rate=30:duration=2.5" -vf "settb=1/90000,setpts=(N/30+0.004*eq(mod(N\,2)\,1))/TB" -fps_mode passthrough -enc_time_base 1/90000 -video_track_timescale 90000 -c:v libx264 -pix_fmt yuv420p -b:v 150k -an -t 2.507 vfr-jitter.mp4
```
