const images = [
  { src: "/images/img2.jpg", alt: "Serra Games - Gordim e os futuros RX", span: "md:col-span-2 md:row-span-2" },
  { src: "/images/img3.jpg", alt: "Serra Games - Double J & Caio", span: "" },
  { src: "/images/img4.jpg", alt: "Serra Games - Vai que dá, capivaras!", span: "" },
  { src: "/images/img5.jpg", alt: "Serra Games - Confesso que não pensamos", span: "md:col-span-2" },
  { src: "/images/img6.jpg", alt: "Serra Games - Nois trupica, mas não cai", span: "" },
  { src: "/images/img7.jpg", alt: "Serra Games - Só não chama pra correr", span: "" },
  { src: "/images/img8.jpg", alt: "Serra Games - Trio tentativa", span: "" },
  { src: "/images/img9.jpg", alt: "Serra Games - 3 gerações sem drama", span: "" },
];

export const Gallery = () => {
  return (
    <section id="gallery" className="py-24 px-4 bg-spartan-dark relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 divider-gradient" />

      <div className="container mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary text-xs font-bold uppercase tracking-[0.3em] mb-4">Galeria</p>
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-foreground">
            NOSSA <span className="text-gradient-fire">LEGIÃO</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Guerreiros que representam a Alpha Cross nas competições e no dia a dia.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className={`group relative overflow-hidden rounded-xl aspect-square cursor-pointer ${image.span}`}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-spartan-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <span className="text-foreground text-sm font-bold tracking-wide">{image.alt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
