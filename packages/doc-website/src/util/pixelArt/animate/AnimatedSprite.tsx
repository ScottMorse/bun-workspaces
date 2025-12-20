import { useEffect, useRef, useState } from "react";
import { loadSpritesheet, type Spritesheet } from "./spritesheet";

export interface AnimatedSpriteProps {
  spritesheetFileName: string;
  width: number;
  onFinish?: () => void;
  loop?: boolean;
  fps: number;
  frameLengths?: Record<number, number | (() => number)>;
  canvasProps?: React.CanvasHTMLAttributes<HTMLCanvasElement>;
}

export const AnimatedSprite = ({
  spritesheetFileName,
  width,
  onFinish,
  loop,
  fps,
  frameLengths,
  canvasProps,
}: AnimatedSpriteProps) => {
  const [spritesheetData, setSpritesheetData] = useState<Spritesheet | null>(
    null
  );

  useEffect(() => {
    loadSpritesheet(spritesheetFileName).then((spritesheet) => {
      setSpritesheetData(spritesheet);
    });
  }, [spritesheetFileName]);

  const isDrawingRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !spritesheetData) return;
    const canvas = canvasRef.current;

    const canvasWidth = width;
    const canvasHeight =
      (spritesheetData.metadata.frames[0].h /
        spritesheetData.metadata.frames[0].w) *
      width;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    const frameDurationMs = 1000 / fps;

    isDrawingRef.current = true;
    let frameIndex = 0;
    let lastFrameTime: number | undefined = undefined;
    let lastFrameLength = 1;
    const draw = (time: number) => {
      if (!isDrawingRef.current) {
        onFinish?.();
        return;
      }

      if (
        !lastFrameTime ||
        time - lastFrameTime >= frameDurationMs * lastFrameLength
      ) {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(
          spritesheetData.frameBitmaps[frameIndex],
          0,
          0,
          spritesheetData.metadata.frames[frameIndex].w,
          spritesheetData.metadata.frames[frameIndex].h,
          0,
          0,
          width,
          canvasHeight
        );

        lastFrameTime = time;
        const frameLength = frameLengths?.[frameIndex];
        lastFrameLength = frameLength
          ? typeof frameLength === "function"
            ? frameLength()
            : frameLength
          : 1;

        frameIndex++;

        if (frameIndex >= spritesheetData.metadata.frames.length) {
          if (loop) {
            frameIndex = 0;
          } else {
            isDrawingRef.current = false;
          }
        }
      }

      requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);
  }, [spritesheetData]);

  useEffect(() => {
    return () => {
      isDrawingRef.current = false;
    };
  }, []);

  return (
    <div className="animated-sprite-container">
      <canvas ref={canvasRef} {...canvasProps} />
    </div>
  );
};
