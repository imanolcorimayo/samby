export const formatPrice = (price: number) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2
  }).format(price);
};

export const formatToMillion = (price: number) => {
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

export const validateProduct = (product: any) => {
  if (!product) return false;

  // Validate it has product name
  if (!product.productName) {
    return false;
  }

  // Validate description
  if (!product.description) {
    return false;
  }

  // Validate is has unit and it's a float number
  if (!product.unit || !["Kg", "Unitario", "Bolsa", "Cajon", "Gramo", "Litro", "Docena"].includes(product.unit)) {
    return false;
  }

  // Validate is has step and it's a float number
  if (!product.step || isNaN(product.step) || ![0.25, 0.5, 1].includes(product.step)) {
    return false;
  }

  // Validate is has price and it's a float number
  if (!product.price || isNaN(product.price)) {
    return false;
  }

  return true;
};

export const formatQuantity = (quantity: number) => {
  const wholePart = Math.floor(quantity); // Get the whole number part
  const decimalPart = quantity - wholePart; // Get the decimal/fractional part

  // Handle different fractional parts
  let fractionText = "";
  if (decimalPart === 0.25) {
    fractionText = " + 1/4";
  } else if (decimalPart === 0.5) {
    fractionText = " + 1/2";
  } else if (decimalPart === 0.75) {
    fractionText = " + 3/4";
  }

  // Return the formatted quantity
  return wholePart > 0 ? `${wholePart}${fractionText}` : fractionText.replace(" + ", "");
};
