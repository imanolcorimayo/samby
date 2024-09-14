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

export const validateClient = (client: any) => {
  if (!client) return false;

  // Validate it has client name
  if (!client.clientName) {
    return false;
  }

  // Validate is has phone number
  if (!client.phone) {
    return false;
  }

  // Validate is has email
  if (!client.address) {
    return false;
  }

  return true;
};

export const formattedDate = (date: string) => {
  const { $dayjs } = useNuxtApp();
  // List of months in Spanish to use in the date format
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  // Get the spanish month
  const month = months[$dayjs(date).month()];

  // Return the formatted date
  return `${month} ${$dayjs(date).format("D, YYYY")}`;
};

export const formatStatus = (status: string) => {
  // Replace "-" with " " and capitalize the all first letters
  return status.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export const createMessage = (products: any, client: any, shippingPrice: any, totalWithShipping: any) => {
  // Verify if the address is empty
  const deliveryAddress = client.address ? client.address : "N/A";

  // Add the introduction name
  let message = `¡Hola, ${client.clientName}! 👋\nTu pedido está completo, estos son los detalles:\n\n`;

  products.forEach((product: any) => {
    const productPrice = formatPrice(product.total);

    // Verify if it's a fraction and add 1/4, 1/2 or 3/4 accordingly
    const quantityText = formatQuantity(product.quantity);

    message += `- ${quantityText} ${product.productName} ${productPrice}\n`;
  });

  // Añade el costo de envío
  message += `\n🚚 Costo de Envío: ${formatPrice(shippingPrice)}\n`;

  // Añade el total
  message += `💵 Total a Pagar: ${formatPrice(totalWithShipping)}\n`;

  // Añade la dirección de envío
  message += `\n📍 Dirección de Envío: ${deliveryAddress}\n`;

  // Cierra con un mensaje amigable
  message += `\n¡Gracias por tu compra! Si necesitas algo más, no dudes en avisarnos. 😊`;

  return message;
};
