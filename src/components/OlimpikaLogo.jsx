/**
 * Logo OLIMPIKA FITNESS – exibida sem alteração (cor/design), apenas redimensionada para enquadrar.
 * Coloque a imagem em public/olimpika-logo.png
 * variant="full" = logo completa para tela de login (só dimensões de enquadramento).
 */
import { useState } from "react";

const LOGO_IMAGE_URL = "/olimpika-logo.png";

export function OlimpikaLogo({ className = "", showText = true, size = "md", variant = "inline" }) {
  const [imgError, setImgError] = useState(false);
  const useImage = !imgError;
  const isFull = variant === "full";

  const sizeClasses = {
    sm: "h-8",
    md: "h-10",
    lg: "h-14",
    xl: "h-20",
    full: "max-h-[160px] md:max-h-[200px] w-auto max-w-[min(100%,380px)]",
  };
  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
    full: "text-2xl md:text-3xl",
  };

  const imgClasses = isFull
    ? sizeClasses.full
    : `${sizeClasses[size]} w-auto object-contain`;

  return (
    <div className={`flex items-center gap-2 justify-center ${isFull ? "w-full" : ""} ${className}`}>
      {useImage ? (
        <img
          src={LOGO_IMAGE_URL}
          alt="OLIMPIKA FITNESS"
          className={`${imgClasses} object-contain`}
          style={{ objectFit: "contain" }}
          onError={() => setImgError(true)}
        />
      ) : (
        <>
          <div
            className={`${isFull ? "h-24 w-24" : sizeClasses[size]} aspect-square min-w-[2.5rem] rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center flex-shrink-0`}
            aria-hidden
          >
            <span className="text-yellow-400 font-bold text-sm">O</span>
          </div>
          <span
            className={`font-bold tracking-tight text-yellow-400 ${textSizeClasses[isFull ? "full" : size]} uppercase`}
            style={{ textShadow: "0 0 20px rgba(250, 204, 21, 0.3)" }}
          >
            Olimpika Fitness
          </span>
        </>
      )}
      {useImage && !isFull && showText && (
        <span
          className={`font-bold tracking-tight text-yellow-400 ${textSizeClasses[size]} uppercase`}
          style={{ textShadow: "0 0 20px rgba(250, 204, 21, 0.3)" }}
        >
          Olimpika Fitness
        </span>
      )}
    </div>
  );
}

export default OlimpikaLogo;
