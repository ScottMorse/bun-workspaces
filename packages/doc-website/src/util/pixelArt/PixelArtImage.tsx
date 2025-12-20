import { loadSpritesheet } from "./animate/spritesheet";

export interface PixelArtImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  path: string;
}

export const PixelArtImage = ({ path, ...props }: PixelArtImageProps) => {
  return <img src={path} className="pixel-art-image" {...props} />;
};
