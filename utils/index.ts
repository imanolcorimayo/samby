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

export const validateSell = (sell: any) => {
  const { $dayjs } = useNuxtApp();

  if (!sell) return false;

  // Validate it has quantity
  if (!sell.quantity) return false;

  // Validate quality
  if (!sell.quality) return false;

  // Validate is has buyingPrice and it's a float number
  if (!sell.buyingPrice || isNaN(sell.buyingPrice)) return false;

  // Validate is has sellingPrice and it's a float number
  if (!sell.sellingPrice || isNaN(sell.sellingPrice)) return false;

  // Validate is has date and validate date format using dayjs
  if (!sell.date || !$dayjs(sell.date, { format: "YYYY-MM-DD" }).isValid()) return false;

  return true;
};
