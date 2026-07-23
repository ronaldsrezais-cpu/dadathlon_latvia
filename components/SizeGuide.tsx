import Image from "next/image";

export default function SizeGuide() {
  return (
    <details className="size-guide">
      <summary>T-kreklu izmēru tabulas</summary>
      <div className="size-guide-content">
        <section>
          <h3>Vīriešu izmēri</h3>
          <Image
            src="/viriesu-izmeri.png"
            width={439}
            height={148}
            alt="Vīriešu T-kreklu izmēri: S 164 cm, M 172 cm, L 179 cm, XL 186 cm, XXL 193 cm, 3XL 200 cm"
            className="size-chart size-chart--adult"
          />
        </section>
        <section>
          <h3>Bērnu izmēri</h3>
          <Image
            src="/bernu-izmeri.png"
            width={963}
            height={246}
            alt="Bērnu T-kreklu izmēru tabula pēc vecuma, auguma, krūšu, vidukļa un gurnu apkārtmēra"
            className="size-chart"
          />
        </section>
        <p className="help-text">Izvēlieties izmēru pēc auguma un ķermeņa mēriem, ne tikai pēc vecuma.</p>
      </div>
    </details>
  );
}
