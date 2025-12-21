import { loadSpritesheet } from "./animate/spritesheet";

export interface PixelArtImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  path: string;
  small?: boolean;
}

export const PixelArtImage = ({
  path,
  small,
  ...props
}: PixelArtImageProps) => {
  return (
    <img
      src={path}
      className={`pixel-art-image ${small ? "small" : ""}`}
      {...props}
    />
  );
};
