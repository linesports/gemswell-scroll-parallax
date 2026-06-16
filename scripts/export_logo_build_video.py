#!/usr/bin/env python3
from __future__ import annotations

import argparse
import importlib
import os
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageChops


PETROL_BLUE = "#051f2c"
BURNT_ORANGE = "#C45235"
VIEWBOX_WIDTH = 390.506
VIEWBOX_HEIGHT = 338.280
SEGMENT_START_OFFSET = 0.06
SEGMENT_STAGGER = 0.026
BASE_SEGMENT_DURATION = 0.34
ROUTED_U_DURATION_MULTIPLIER = 1.69
BASE_BUILD_FRAMES = 96
GLOBAL_VIDEO_SLOWDOWN = 1.4
ACTIVE_EASE_POWER = 3.2
BLUE_U_SEGMENT_INDEX = 3
ORANGE_U_SEGMENT_INDEX = 6


@dataclass(frozen=True)
class Sweep:
    direction: str
    x: float
    y: float
    width: float
    height: float


@dataclass(frozen=True)
class Segment:
    color: str
    d: str
    sweep: Sweep
    route: str | None = None
    route_stroke_width: float | None = None
    route_length: float | None = None


SEGMENTS = [
    Segment(
        color=BURNT_ORANGE,
        d="M 212.878 18.000 L 212.878 136.103 L 234.731 136.103 L 234.731 49.665 C 234.731 35.182 225.636 22.904 212.878 18.000 Z",
        sweep=Sweep("down", 208, 14, 31, 126),
    ),
    Segment(
        color=PETROL_BLUE,
        d="M 179.148 320.278 L 179.148 18.000 C 166.391 22.903 157.296 35.182 157.296 49.665 L 157.296 290.140 C 157.296 304.231 166.485 316.046 179.148 320.278 Z",
        sweep=Sweep("up", 153, 14, 31, 310),
    ),
    Segment(
        color=BURNT_ORANGE,
        d="M 218.597 159.469 C 205.692 159.469 195.231 169.930 195.231 182.835 L 195.231 182.836 L 212.878 182.836 L 212.878 320.280 C 225.542 316.047 234.731 304.231 234.731 290.140 L 234.731 159.469 L 218.597 159.469 Z",
        sweep=Sweep("down", 191, 155, 48, 169),
    ),
    Segment(
        color=PETROL_BLUE,
        d="M 143.954 183.450 L 64.747 183.450 C 38.969 183.450 18.000 162.480 18.000 136.703 C 18.000 110.926 38.969 89.956 64.747 89.956 L 144.149 89.956 L 144.149 112.457 L 64.747 112.457 C 51.378 112.457 40.500 123.333 40.500 136.703 C 40.500 150.071 51.378 160.949 64.747 160.949 L 143.954 160.949 L 143.954 183.450 Z",
        sweep=Sweep("left", 14, 86, 134, 102),
        route="M 143.954 101.206 L 64.747 101.206 C 44.100 101.206 29.250 116.930 29.250 136.703 C 29.250 156.474 44.100 172.200 64.747 172.200 L 143.954 172.200",
        route_stroke_width=26,
        route_length=540.956,
    ),
    Segment(
        color=BURNT_ORANGE,
        d="M 350.005 112.457 L 247.879 112.457 L 247.879 89.956 L 372.506 89.956 C 372.506 102.383 362.432 112.457 350.005 112.457 Z",
        sweep=Sweep("right", 244, 86, 133, 31),
    ),
    Segment(
        color=PETROL_BLUE,
        d="M 144.149 252.519 L 18.709 252.519 C 18.709 240.092 28.784 230.018 41.210 230.018 L 144.149 230.018 L 144.149 252.519 Z",
        sweep=Sweep("left", 14, 226, 134, 31),
    ),
    Segment(
        color=BURNT_ORANGE,
        d="M 324.423 252.519 L 247.877 252.519 L 247.877 230.018 L 324.423 230.018 C 337.792 230.018 350.005 219.140 350.005 205.771 C 350.005 192.401 337.792 181.526 324.423 181.526 L 247.877 181.526 L 247.877 159.025 L 324.423 159.025 C 350.198 159.025 372.506 179.996 372.506 205.771 C 372.506 231.549 350.198 252.519 324.423 252.519 Z",
        sweep=Sweep("right", 244, 155, 133, 102),
        route="M 247.877 241.268 L 324.423 241.268 C 345.800 241.268 361.256 225.650 361.256 205.771 C 361.256 185.890 345.800 170.276 324.423 170.276 L 247.877 170.276",
        route_stroke_width=26,
        route_length=534.6,
    ),
]


def clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def ease_in_out(value: float) -> float:
    value = clamp(value)
    if value < 0.5:
        return 0.5 * (2 * value) ** ACTIVE_EASE_POWER

    return 1 - 0.5 * (2 * (1 - value)) ** ACTIVE_EASE_POWER


def base_segment_start(index: int) -> float:
    return SEGMENT_START_OFFSET + index * SEGMENT_STAGGER


def segment_start(index: int) -> float:
    if index == BLUE_U_SEGMENT_INDEX:
        return base_segment_start(ORANGE_U_SEGMENT_INDEX)

    return base_segment_start(index)


def segment_duration(index: int, route_multiplier: float = ROUTED_U_DURATION_MULTIPLIER) -> float:
    multiplier = route_multiplier if SEGMENTS[index].route else 1
    return BASE_SEGMENT_DURATION * multiplier


def timeline_end(route_multiplier: float = ROUTED_U_DURATION_MULTIPLIER) -> float:
    return max(
        segment_start(index) + segment_duration(index, route_multiplier)
        for index in range(len(SEGMENTS))
    )


def segment_open(index: int, timeline_progress: float) -> float:
    start = segment_start(index)
    duration = segment_duration(index)
    return ease_in_out((timeline_progress - start) / duration)


def sweep_rect(sweep: Sweep, open_amount: float) -> str:
    open_amount = clamp(open_amount)
    if sweep.direction == "left":
        width = sweep.width * open_amount
        x = sweep.x + sweep.width - width
        y = sweep.y
        height = sweep.height
    elif sweep.direction == "up":
        height = sweep.height * open_amount
        x = sweep.x
        y = sweep.y + sweep.height - height
        width = sweep.width
    elif sweep.direction == "down":
        x = sweep.x
        y = sweep.y
        width = sweep.width
        height = sweep.height * open_amount
    else:
        x = sweep.x
        y = sweep.y
        width = sweep.width * open_amount
        height = sweep.height

    return f'x="{x:.3f}" y="{y:.3f}" width="{width:.3f}" height="{height:.3f}"'


def render_svg(
    width: int,
    height: int,
    timeline_progress: float,
    *,
    clean_completed_segments: bool = True,
    color_override: str | None = None,
) -> str:
    scale = min(width * 0.72 / VIEWBOX_WIDTH, height * 0.91 / VIEWBOX_HEIGHT)
    tx = (width - VIEWBOX_WIDTH * scale) / 2
    ty = (height - VIEWBOX_HEIGHT * scale) / 2
    defs: list[str] = []
    paths: list[str] = []

    for index, segment in enumerate(SEGMENTS):
        fill_color = color_override or segment.color
        open_amount = segment_open(index, timeline_progress)
        if clean_completed_segments and open_amount >= 0.999:
            reveal = ""
        elif segment.route:
            length = segment.route_length or 1
            visible = length * open_amount
            gap = length * 2
            defs.append(
                f"""
                <mask id="logo-fill-route-{index}" maskUnits="userSpaceOnUse" x="0" y="0" width="{VIEWBOX_WIDTH}" height="{VIEWBOX_HEIGHT}">
                  <rect width="{VIEWBOX_WIDTH}" height="{VIEWBOX_HEIGHT}" fill="black"/>
                  <path d="{segment.route}" fill="none" stroke="white" stroke-linecap="butt" stroke-linejoin="round" stroke-width="{segment.route_stroke_width}" stroke-dasharray="{visible:.3f} {gap:.3f}" stroke-dashoffset="0"/>
                </mask>
                """
            )
            reveal = f'mask="url(#logo-fill-route-{index})"'
        else:
            defs.append(
                f"""
                <mask id="logo-fill-sweep-{index}" maskUnits="userSpaceOnUse" x="0" y="0" width="{VIEWBOX_WIDTH}" height="{VIEWBOX_HEIGHT}">
                  <rect width="{VIEWBOX_WIDTH}" height="{VIEWBOX_HEIGHT}" fill="black"/>
                  <rect {sweep_rect(segment.sweep, open_amount)} fill="white"/>
                </mask>
                """
            )
            reveal = f'mask="url(#logo-fill-sweep-{index})"'

        paths.append(
            f'<path d="{segment.d}" fill="{fill_color}" fill-rule="nonzero" {reveal}/>'
        )

    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <rect width="{width}" height="{height}" fill="#ffffff"/>
  <defs>
    {''.join(defs)}
  </defs>
  <g transform="translate({tx:.3f} {ty:.3f}) scale({scale:.6f})">
    {''.join(paths)}
  </g>
</svg>
"""


def render_png_with_sips(svg_path: Path, png_path: Path) -> None:
    result = subprocess.run(
        ["sips", "-s", "format", "png", str(svg_path), "--out", str(png_path)],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stdout)


def write_frame(
    *,
    frame: int,
    width: int,
    height: int,
    timeline_progress: float,
    svg_dir: Path,
    frame_dir: Path,
    clean_completed_segments: bool = True,
    color_override: str | None = None,
) -> Path:
    svg_path = svg_dir / f"frame_{frame:04d}.svg"
    png_path = frame_dir / f"frame_{frame:04d}.png"
    svg_path.write_text(
        render_svg(
            width,
            height,
            timeline_progress,
            clean_completed_segments=clean_completed_segments,
            color_override=color_override,
        ),
        encoding="utf-8",
    )
    render_png_with_sips(svg_path, png_path)
    return png_path


def nonwhite_pixels(path: Path) -> int:
    image = Image.open(path).convert("RGB")
    colors = image.getcolors(maxcolors=10_000_000)
    if colors is None:
        raise RuntimeError(f"Too many colors to inspect {path}")

    return sum(count for count, color in colors if color != (255, 255, 255))


def images_match(path: Path, reference: Image.Image) -> bool:
    image = Image.open(path).convert("RGB")
    return ImageChops.difference(image, reference).getbbox() is None


def detect_animation_bounds(frame_dir: Path, total_frames: int) -> tuple[int, int]:
    frame_paths = [frame_dir / f"frame_{frame:04d}.png" for frame in range(total_frames)]
    first_visible = next(
        (index for index, path in enumerate(frame_paths) if nonwhite_pixels(path) > 0),
        0,
    )
    final_image = Image.open(frame_paths[-1]).convert("RGB")
    first_complete = next(
        (index for index, path in enumerate(frame_paths) if index >= first_visible and images_match(path, final_image)),
        total_frames - 1,
    )

    return first_visible, first_complete


def linear_timeline_progress(frame: int, build_frames: int, build_end: float) -> float:
    build_index = min(frame, build_frames - 1)
    video_progress = build_index / max(build_frames - 1, 1)
    return build_end * video_progress


def curved_active_timeline_progress(
    *,
    frame: int,
    active_start_frame: int,
    active_end_frame: int,
    active_start_timeline: float,
    active_end_timeline: float,
    build_end: float,
) -> float:
    if frame < active_start_frame:
        return 0

    if frame >= active_end_frame:
        return build_end

    active_span = max(active_end_frame - active_start_frame, 1)
    active_progress = (frame - active_start_frame) / active_span
    return active_start_timeline + (active_end_timeline - active_start_timeline) * ease_in_out(active_progress)


def find_ffmpeg() -> str | None:
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg:
        return ffmpeg

    tools_dir = Path("/tmp/gemswell-logo-video-tools")
    try:
        sys.path.insert(0, str(tools_dir))
        imageio_ffmpeg = importlib.import_module("imageio_ffmpeg")
    except Exception:
        tools_dir.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [
                sys.executable,
                "-m",
                "pip",
                "install",
                "--quiet",
                "--target",
                str(tools_dir),
                "imageio-ffmpeg",
            ],
            check=False,
        )
        importlib.invalidate_caches()
        try:
            imageio_ffmpeg = importlib.import_module("imageio_ffmpeg")
        except Exception:
            return None

    return imageio_ffmpeg.get_ffmpeg_exe()


def make_mp4(frame_dir: Path, output_path: Path, fps: int) -> bool:
    ffmpeg = find_ffmpeg()
    if not ffmpeg:
        return False

    subprocess.run(
        [
            ffmpeg,
            "-y",
            "-framerate",
            str(fps),
            "-i",
            str(frame_dir / "frame_%04d.png"),
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-vf",
            "format=yuv420p",
            "-movflags",
            "+faststart",
            str(output_path),
        ],
        check=True,
    )
    return True


def make_gif(frame_dir: Path, output_path: Path, fps: int) -> None:
    frames = [Image.open(path).convert("P", palette=Image.Palette.ADAPTIVE) for path in sorted(frame_dir.glob("frame_*.png"))]
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=round(1000 / fps),
        loop=0,
        optimize=False,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Export the Gemswell logo build as video frames.")
    parser.add_argument("--width", type=int, default=1920)
    parser.add_argument("--height", type=int, default=1080)
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--build-frames", type=int, default=None)
    parser.add_argument("--hold-frames", type=int, default=24)
    parser.add_argument("--out-dir", type=Path, default=Path("exports"))
    args = parser.parse_args()

    output_dir = args.out_dir.resolve()
    work_dir = output_dir / "logo-build-video-work"
    probe_svg_dir = work_dir / "probe-svgs"
    probe_frame_dir = work_dir / "probe-frames"
    previous_svg_dir = work_dir / "previous-svgs"
    previous_frame_dir = work_dir / "previous-frames"
    fixed_svg_dir = work_dir / "fixed-svgs"
    fixed_frame_dir = work_dir / "fixed-frames"
    black_svg_dir = work_dir / "black-svgs"
    black_frame_dir = work_dir / "black-frames"
    previous_mp4_path = output_dir / "gemswell-logo-build-previous.mp4"
    previous_gif_path = output_dir / "gemswell-logo-build-previous.gif"
    fixed_mp4_path = output_dir / "gemswell-logo-build-mask-clean.mp4"
    fixed_gif_path = output_dir / "gemswell-logo-build-mask-clean.gif"
    black_mp4_path = output_dir / "gemswell-logo-build-mask-clean-black.mp4"
    black_gif_path = output_dir / "gemswell-logo-build-mask-clean-black.gif"
    latest_mp4_path = output_dir / "gemswell-logo-build.mp4"
    latest_gif_path = output_dir / "gemswell-logo-build.gif"

    shutil.rmtree(work_dir, ignore_errors=True)
    probe_svg_dir.mkdir(parents=True, exist_ok=True)
    probe_frame_dir.mkdir(parents=True, exist_ok=True)
    previous_svg_dir.mkdir(parents=True, exist_ok=True)
    previous_frame_dir.mkdir(parents=True, exist_ok=True)
    fixed_svg_dir.mkdir(parents=True, exist_ok=True)
    fixed_frame_dir.mkdir(parents=True, exist_ok=True)
    black_svg_dir.mkdir(parents=True, exist_ok=True)
    black_frame_dir.mkdir(parents=True, exist_ok=True)

    build_end = timeline_end()
    base_build_end = timeline_end(route_multiplier=1)
    build_frames = args.build_frames or round(
        BASE_BUILD_FRAMES * build_end / base_build_end * GLOBAL_VIDEO_SLOWDOWN
    )
    total_frames = build_frames + args.hold_frames

    for frame in range(total_frames):
        write_frame(
            frame=frame,
            width=args.width,
            height=args.height,
            timeline_progress=linear_timeline_progress(frame, build_frames, build_end),
            svg_dir=probe_svg_dir,
            frame_dir=probe_frame_dir,
            clean_completed_segments=False,
        )

    active_start_frame, active_end_frame = detect_animation_bounds(probe_frame_dir, total_frames)
    active_start_timeline = linear_timeline_progress(active_start_frame, build_frames, build_end)
    active_end_timeline = linear_timeline_progress(active_end_frame, build_frames, build_end)

    for frame in range(total_frames):
        timeline_progress = curved_active_timeline_progress(
            frame=frame,
            active_start_frame=active_start_frame,
            active_end_frame=active_end_frame,
            active_start_timeline=active_start_timeline,
            active_end_timeline=active_end_timeline,
            build_end=build_end,
        )
        write_frame(
            frame=frame,
            width=args.width,
            height=args.height,
            timeline_progress=timeline_progress,
            svg_dir=previous_svg_dir,
            frame_dir=previous_frame_dir,
            clean_completed_segments=False,
        )

        if frame < active_end_frame:
            shutil.copy2(previous_svg_dir / f"frame_{frame:04d}.svg", fixed_svg_dir / f"frame_{frame:04d}.svg")
            shutil.copy2(previous_frame_dir / f"frame_{frame:04d}.png", fixed_frame_dir / f"frame_{frame:04d}.png")
            write_frame(
                frame=frame,
                width=args.width,
                height=args.height,
                timeline_progress=timeline_progress,
                svg_dir=black_svg_dir,
                frame_dir=black_frame_dir,
                clean_completed_segments=False,
                color_override="#000000",
            )
        else:
            write_frame(
                frame=frame,
                width=args.width,
                height=args.height,
                timeline_progress=build_end,
                svg_dir=fixed_svg_dir,
                frame_dir=fixed_frame_dir,
                clean_completed_segments=True,
            )
            write_frame(
                frame=frame,
                width=args.width,
                height=args.height,
                timeline_progress=build_end,
                svg_dir=black_svg_dir,
                frame_dir=black_frame_dir,
                clean_completed_segments=True,
                color_override="#000000",
            )

    previous_mp4_created = make_mp4(previous_frame_dir, previous_mp4_path, args.fps)
    make_gif(previous_frame_dir, previous_gif_path, args.fps)
    fixed_mp4_created = make_mp4(fixed_frame_dir, fixed_mp4_path, args.fps)
    make_gif(fixed_frame_dir, fixed_gif_path, args.fps)
    black_mp4_created = make_mp4(black_frame_dir, black_mp4_path, args.fps)
    make_gif(black_frame_dir, black_gif_path, args.fps)

    if fixed_mp4_created:
        shutil.copy2(fixed_mp4_path, latest_mp4_path)
    shutil.copy2(fixed_gif_path, latest_gif_path)

    print(f"frames={total_frames}")
    print(f"build_frames={build_frames}")
    print(f"global_video_slowdown={GLOBAL_VIDEO_SLOWDOWN}")
    print(f"u_duration_multiplier={ROUTED_U_DURATION_MULTIPLIER}")
    print(f"active_ease_power={ACTIVE_EASE_POWER}")
    print(f"first_logo_frame={active_start_frame}")
    print(f"first_complete_frame={active_end_frame}")
    print(f"active_frame_span={active_end_frame - active_start_frame}")
    print(f"previous_frame_dir={previous_frame_dir}")
    print(f"fixed_frame_dir={fixed_frame_dir}")
    print(f"black_frame_dir={black_frame_dir}")
    print(f"mask_fix_first_frame={active_end_frame}")
    print(f"previous_gif={previous_gif_path}")
    if previous_mp4_created:
        print(f"previous_mp4={previous_mp4_path}")
    print(f"fixed_gif={fixed_gif_path}")
    if fixed_mp4_created:
        print(f"fixed_mp4={fixed_mp4_path}")
        print(f"latest_mp4={latest_mp4_path}")
    else:
        print("fixed_mp4=not-created")
    print(f"black_gif={black_gif_path}")
    if black_mp4_created:
        print(f"black_mp4={black_mp4_path}")
    else:
        print("black_mp4=not-created")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
