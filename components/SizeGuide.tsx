const adultSizes = [
  { size: "S", height: "164" },
  { size: "M", height: "172" },
  { size: "L", height: "179" },
  { size: "XL", height: "186" },
  { size: "XXL", height: "193" },
  { size: "3XL", height: "200" },
];

const childSizes = [
  { size: "6XS", age: "4–5", height: "100–108", chest: "55–57", waist: "54–55", hips: "60–62" },
  { size: "5XS", age: "5–6", height: "109–117", chest: "58–61", waist: "56–57", hips: "63–65" },
  { size: "4XS", age: "7–8", height: "118–128", chest: "62–66", waist: "58–60", hips: "66–68" },
  { size: "3XS", age: "9–10", height: "129–140", chest: "67–72", waist: "61–64", hips: "69–74" },
  { size: "2XS", age: "11–12", height: "141–152", chest: "73–79", waist: "65–68", hips: "75–80" },
  { size: "XS", age: "12–14", height: "153–164", chest: "80–87", waist: "69–72", hips: "81–86" },
];

export function AdultSizeTable() {
  return (
    <div className="size-reference size-reference--adult" aria-label="Vīriešu T-kreklu izmēru tabula">
      <p className="size-reference-title">Vīriešu izmēri pēc auguma</p>
      <div className="table-scroll">
        <table className="size-table size-table--adult">
          <thead>
            <tr>
              <th>Izmērs</th>
              {adultSizes.map((item) => <th key={item.size}>{item.size}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>Augums, cm</th>
              {adultSizes.map((item) => <td key={item.size}>{item.height}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ChildSizeTable() {
  return (
    <div className="size-reference size-reference--child" aria-label="Bērnu T-kreklu izmēru tabula">
      <p className="size-reference-title">Bērnu izmēri, cm</p>
      <div className="table-scroll">
        <table className="size-table size-table--child">
          <thead>
            <tr>
              <th>Izmērs</th>
              <th>Gadi</th>
              <th>Augums</th>
              <th>Krūtis</th>
              <th>Viduklis</th>
              <th>Gurni</th>
            </tr>
          </thead>
          <tbody>
            {childSizes.map((item) => (
              <tr key={item.size}>
                <th>{item.size}</th>
                <td>{item.age}</td>
                <td>{item.height}</td>
                <td>{item.chest}</td>
                <td>{item.waist}</td>
                <td>{item.hips}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="size-help">Izmēru izvēlieties galvenokārt pēc bērna auguma un ķermeņa mēriem.</p>
    </div>
  );
}
