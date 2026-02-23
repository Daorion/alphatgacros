import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Legacy } from "@/components/Legacy";
import { Programs } from "@/components/Programs";
import { Gallery } from "@/components/Gallery";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <Legacy />
      <Programs />
      <Gallery />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;
