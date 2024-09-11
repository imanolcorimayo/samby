<template>
  <div class="w-full flex flex-col gap-[2rem] flex-1 min-h-full justify-start" v-if="lastInsertedOrder.orderId">
    <div class="flex flex-col items-center gap-[1rem]">
      <IconParkOutlineCheckOne class="text-[3rem] text-success" />
      <span class="text-[2rem] font-semibold text-center">¡Pedido Confirmado!</span>
      <span class="text-gray-500 text-center">Fecha de envío: {{ formattedDate }} </span>
    </div>
    <div class="flex flex-col gap-3">
      <span class="font-semibold text-xl">Resumen del pedido</span>
      <table>
        <thead>
          <tr class="text-gray-400 border-b">
            <th class="font-medium text-start">Producto</th>
            <th class="font-medium">Precio</th>
            <th class="font-medium">Cantidad</th>
            <th class="font-medium">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr class="text-center border-b" v-for="product in lastInsertedOrder.order.products" :key="product.id">
            <td class="py-3 text-start">{{ product.productName }}</td>
            <td class="py-3">{{ formatPrice(product.price) }}</td>
            <td class="py-3">{{ product.quantity }}</td>
            <td class="py-3">{{ formatPrice(product.total) }}</td>
          </tr>
          <tr class="text-center border-b font-semibold">
            <td class="py-3 text-start">Envío</td>
            <td class="py-3"></td>
            <td class="py-3"></td>
            <td class="py-3">{{ formatPrice(lastInsertedOrder.order.shippingPrice) }}</td>
          </tr>
          <tr class="text-center border-b font-semibold">
            <td class="py-3 text-start">Total</td>
            <td class="py-3"></td>
            <td class="py-3"></td>
            <td class="py-3">{{ formatPrice(lastInsertedOrder.order.totalAmount ?? 0) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex flex-col gap-3">
      <span class="font-semibold text-xl">Datos del cliente</span>
      <div class="flex gap-1">
        <span class="font-semibold">Nombre:</span>
        <span>{{ lastInsertedOrder.order.client.clientName }}</span>
      </div>
      <div class="flex gap-1">
        <span class="font-semibold">Teléfono:</span>
        <span>{{ lastInsertedOrder.order.client.phone }}</span>
      </div>
      <div class="flex gap-1">
        <span class="font-semibold">Dirección:</span>
        <span>{{ lastInsertedOrder.order.client.address ?? "N/A" }}</span>
      </div>
    </div>
    <div class="flex flex-col gap-4">
      <div class="flex flex-col md:flex-row gap-3">
        <NuxtLink
          to="/pedidos/nuevo"
          class="flex-1 w-full text-nowrap flex items-center justify-center gap-2 btn bg-primary text-white text-center"
        >
          <TablerPlus class="text-xl" />
          Agregar otro pedido</NuxtLink
        >
        <button
          @click="sendConfirmationMessage"
          class="flex-1 w-full text-nowrap flex items-center justify-center gap-2 btn bg-secondary w-full text-center ring-1 ring-gray-300"
        >
          <MingcuteWhatsappLine class="text-xl" />
          Enviar mensaje al cliente
        </button>
        <NuxtLink
          to="/pedidos"
          class="flex-1 w-full text-nowrap flex items-center justify-center gap-2 btn bg-secondary w-full text-center ring-1 ring-gray-300"
        >
          <IconParkOutlineTransactionOrder class="text-xl" />
          Ver pedidos</NuxtLink
        >
      </div>
    </div>
  </div>
  <div v-else>No se ha creado ningún pedido</div>
</template>

<script setup>
import TablerPlus from "~icons/tabler/plus";
import IconParkOutlineCheckOne from "~icons/icon-park-outline/check-one";
import MingcuteWhatsappLine from "~icons/mingcute/whatsapp-line";
import IconParkOutlineTransactionOrder from "~icons/icon-park-outline/transaction-order";
import { ToastEvents } from "~/interfaces";

// ------- Define Useful Properties -------
const { $dayjs } = useNuxtApp();
// ------- Define Pinia Vars --------
const ordersStore = useOrdersStore();
const { lastInsertedOrder } = storeToRefs(ordersStore);

// ------- Define Computed --------
const formattedDate = computed(() => {
  // List of months in Spanish to use in the date format
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  // Get the spanish month
  const month = months[$dayjs(lastInsertedOrder.value.order.shippingDate).month()];

  // Return the formatted date
  return `${month} ${$dayjs(lastInsertedOrder.value.order.shippingDate).format("D, YYYY")}`;
});

// Check if no order was created
if (!lastInsertedOrder.value.orderId) {
  // Redirect to the new order page
  useToast(ToastEvents.error, "No se ha creado ningún pedido");
  setTimeout(() => navigateTo("/pedidos/nuevo"), 2000);
}

// ------- Define Methods --------
function sendConfirmationMessage() {
  // Clean the client's phone number to contain only numbers
  const cleanPhone = lastInsertedOrder.value.order.client.phone.replace(/\D/g, "");

  // Message creation
  const message = createMessage(
    lastInsertedOrder.value.order.products,
    lastInsertedOrder.value.order.client,
    lastInsertedOrder.value.order.shippingPrice,
    lastInsertedOrder.value.order.totalAmount
  );

  // Send message to wsp
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  // Open message in a new window
  window.open(url, "_blank");
}

function createMessage(products, client, shippingPrice, totalWithShipping) {
  // Verify if the address is empty
  const deliveryAddress = client.address ? client.address : "N/A";

  // Add the introduction name
  let message = `¡Hola, ${client.clientName}! 👋\nTu pedido está completo, estos son los detalles:\n\n`;

  products.forEach((product) => {
    const productPrice = formatPrice(product.price);

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
}

useHead({
  title: "Pedido Confirmado"
});
</script>
