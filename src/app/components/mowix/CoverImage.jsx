import Image from "next/image";

// Full-bleed photography rendered through next/image in place of exported CSS
// backgrounds, so each section gets a correctly sized, sharp source.
export default function CoverImage({
  src,
  alt = "",
  sizes = "100vw",
  position = "center center",
  priority = false,
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      quality={90}
      sizes={sizes}
      priority={priority}
      className="cover-image"
      style={{ objectFit: "cover", objectPosition: position }}
    />
  );
}
