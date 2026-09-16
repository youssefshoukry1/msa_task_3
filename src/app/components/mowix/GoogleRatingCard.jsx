import Image from "next/image";
import HomeIcon from "./HomeIcon";

const AVATARS = ["/mowix/images/2026/02/Photo-12.jpg", "/mowix/images/2026/02/Photo-5.jpg", "/mowix/images/2026/02/Photo-8.jpg"];

// Navy Google rating card (logo, score, gold stars, customer avatars), matching the testimonials card.
export default function GoogleRatingCard({ score = 4.5 }) {
  return (
    <div className="google-rating">
      <Image className="google-rating__logo" width="512" height="512" src="/mowix/images/2026/02/google.png" alt="Google" sizes="52px" />
      <div className="google-rating__info">
        <div className="google-rating__score">
          <span className="google-rating__value">{score.toFixed(1)}</span>
          <span className="google-rating__stars" role="img" aria-label={`${score} von 5 Sternen`}>
            {[0, 1, 2, 3, 4].map((index) => {
              const fill = Math.max(0, Math.min(1, score - index));
              return (
                <span key={index} className="google-rating__star">
                  <HomeIcon name="star" />
                  <span className="google-rating__star-fill" style={{ width: `${fill * 100}%` }}>
                    <HomeIcon name="star" />
                  </span>
                </span>
              );
            })}
          </span>
        </div>
        <p className="google-rating__label">Google Bewertungen</p>
      </div>
      <div className="google-rating__avatars" aria-hidden="true">
        {AVATARS.map((src) => (
          <Image key={src} width="800" height="800" src={src} alt="" sizes="48px" quality={90} />
        ))}
      </div>
    </div>
  );
}
