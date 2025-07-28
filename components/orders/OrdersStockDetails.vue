<template>
  <ModalStructure ref="mainModal">
    <template #header>
      <div class="flex flex-col gap-2 w-full">
        <div class="flex flex-col cursor-pointer w-full">
          <span class="font-bold text-xl">Lista de compra</span>
          <span class="text-gray-500">Fecha: {{ $dayjs(dateToFilter).format("DD/MM/YYYY") }}</span>
        </div>
      </div>
    </template>
    <template #default>
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <span class="font-semibold text-lg">Lista de compra en base a pedidos pendientes</span>
          <table>
            <thead>
              <tr class="text-gray-400 border-b">
                <th class="font-medium text-start">Producto</th>
                <th class="font-medium">Cantidad Total</th>
                <th class="font-medium">Total Descontando Stock</th>
              </tr>
            </thead>
            <tbody>
              <tr class="text-center border-b" v-for="product in finalList" :key="product.id">
                <td class="py-3 text-start">{{ `${product.productName} (${product.unit})` }}</td>
                <td class="py-3">{{ product.finalQuantity }}</td>
                <td class="py-3">{{ Math.max(product.finalQuantity - product.stockUsed, 0) }}</td>
                <td class="py-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
    <template #footer>
      <button
        @click="sendListMessage"
        class="flex-1 w-full text-nowrap flex items-center justify-center gap-2 btn bg-secondary w-full text-center ring-1 ring-gray-300"
      >
        <MingcuteWhatsappLine class="text-xl" />
        Recibir lista en WhatsApp
      </button>
    </template>
  </ModalStructure>
  <Loader v-if="submitting" />
  <ConfirmDialogue ref="confirmDialogue" />
</template>

<script setup>
import MingcuteWhatsappLine from "~icons/mingcute/whatsapp-line";

// ----- Define Useful Properties -----
const { $dayjs } = useNuxtApp();
// ----- Define Pinia Vars -----
const indexStore = useIndexStore();

// ----- Define Vars -----
const pendingOrders = ref([]);
const dateToFilter = ref("");

// Refs
const mainModal = ref(null);

// ----- Define Computed -----
const finalList = computed(() => {
  // Filter orders based on the date selected
  const datesBasedOrders = pendingOrders.value.filter((order) => order.shippingDate === dateToFilter.value);

  const list = [];

  datesBasedOrders.forEach((order) => {
    order.products.forEach((product) => {
      const index = list.findIndex((item) => item.productId === product.productId);

      if (index === -1) {
        list.push({
          ...product,
          finalQuantity: product.quantity,
          stockUsed: product.stockUsed ?? 0
        });
      } else {
        list[index].finalQuantity += product.quantity;
        list[index].stockUsed += product.stockUsed ?? 0;
      }
    });
  });

  return list;
});

// ----- Define Methods -----
function sendListMessage() {
  // Clean the client's phone number to contain only numbers
  const phone = indexStore.currentBusiness.phone;

  if (!phone) {
    useToast(
      "error",
      "No se ha encontrado un número de teléfono para enviar el mensaje. Actualizalo en la configuración de la empresa."
    );
    return;
  }
  const cleanPhone = phone.replace(/\D/g, "");

  // Message creation
  let message = `Lista de productos que necesitamos comprar para el ${$dayjs(dateToFilter.value).format(
    "DD/MM/YYYY"
  )}:\n\n`;

  finalList.value.forEach((product) => {
    message += `- ${product.productName} (${product.unit}) - ${product.finalQuantity}\n`;
  });

  // Message with the total w/o stock
  message += `\nTotal sin stock: \n\n`;
  finalList.value.forEach((product) => {
    message += `- ${product.productName} (${product.unit}) - ${Math.max(
      product.finalQuantity - product.stockUsed,
      0
    )}\n`;
  });

  // Send message to wsp
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  // Open message in a new window
  window.open(url, "_blank");
}

// ----- Define Methods -------
const showStockList = (orders, date) => {
  if (!mainModal.value) {
    useToast("error", "Parece que hay un error en el sistema, por favor intenta nuevamente.");
    return;
  }

  // This is the only way to make it work, otherwise it will be a reference since there are many nested objects
  pendingOrders.value = JSON.parse(JSON.stringify(orders));
  dateToFilter.value = date;

  // Show modal
  mainModal.value.showModal();
};

// ----- Define Hooks -----

// ----- Define Watchers -----

// ----- Define Expose -----
defineExpose({ showStockList });
</script>
