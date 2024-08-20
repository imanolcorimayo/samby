export const formatPrice = (price: Number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2
  }).format(price);
};

export const formatToMillion = (price: Number) => {
  // Transfor to million and round to 2 decimals
  const million = price / 1000000;

  return (
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2
    }).format(million) + "M"
  );
};
