const images = [
  { src: "/images/img2.jpg", alt: "Serra Games - Gordim e os futuros RX" },
  { src: "/images/img3.jpg", alt: "Serra Games - Double J & Caio" },
  { src: "/images/img4.jpg", alt: "Serra Games - Vai que dá, capivaras!" },
  { src: "/images/img5.jpg", alt: "Serra Games - Confesso que não pensamos" },
  { src: "/images/img6.jpg", alt: "Serra Games - Nois trupica, mas não cai" },
  { src: "/images/img7.jpg", alt: "Serra Games - Só não chama pra correr" },
  { src: "/images/img8.jpg", alt: "Serra Games - Trio tentativa" },
  { src: "/images/img9.jpg", alt: "Serra Games - 3 gerações sem drama" },
];

export const Gallery = () => {
  return (
    <section id="gallery" className="py-20 px-4 bg-spartan-dark">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-foreground">
            NOSSA <span className="text-transparent bg-clip-text bg-gradient-fire">LEGIÃO</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Guerreiros que representam a Alpha Cross nas competições e no dia a dia.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative aspect-square overflow-hidden rounded-lg group cursor-pointer"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-spartan-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
