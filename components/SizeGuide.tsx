const adultSizes = [
  { size: "XS", width: "47", height: "67" },
  { size: "S", width: "50", height: "69" },
  { size: "M", width: "53", height: "72" },
  { size: "L", width: "56", height: "74" },
  { size: "XL", width: "59", height: "76" },
  { size: "XXL", width: "62", height: "79" },
  { size: "3XL", width: "65", height: "82" },
  { size: "4XL", width: "68", height: "85" },
  { size: "5XL", width: "71", height: "88" },
];

const childSizes = [
  { size: "2", width: "31", height: "42" },
  { size: "4", width: "34", height: "45" },
  { size: "6", width: "37", height: "48" },
  { size: "8", width: "40", height: "51" },
  { size: "10", width: "43", height: "55" },
  { size: "12", width: "46", height: "59" },
];

export function AdultSizeTable() {
  return (
    <div className="size-reference size-reference--adult" aria-label="Pieaugušo T-kreklu izmēru tabula">
      <p className="size-reference-title">Pieaugušo T-kreklu izmēri</p>
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
              <th>Platums, cm</th>
              {adultSizes.map((item) => <td key={item.size}>{item.width}</td>)}
            </tr>
            <tr>
              <th>Garums, cm</th>
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
      <p className="size-reference-title">Bērnu T-kreklu izmēri</p>
      <div className="table-scroll">
        <table className="size-table size-table--child">
          <thead>
            <tr>
              <th>Izmērs</th>
              <th>Platums, cm</th>
              <th>Garums, cm</th>
            </tr>
          </thead>
          <tbody>
            {childSizes.map((item) => (
              <tr key={item.size}>
                <th>{item.size}</th>
                <td>{item.width}</td>
                <td>{item.height}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
