<template>
  <ModalStructure ref="mainModal">
    <template #header>
      <div class="flex flex-col gap-2 w-full">
        <div class="flex flex-col cursor-pointer w-full">
          <span class="font-bold text-xl">Detalle de lista de compra</span>
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
              </tr>
            </thead>
            <tbody>
              <tr class="text-center border-b" v-for="product in finalList" :key="product.id">
                <td class="py-3 text-start">{{ `${product.productName} (${product.unit})` }}</td>
                <td class="py-3">{{ product.finalQuantity }}</td>
                <td class="py-3"></td>
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

// ----- Define Pinia Vars -----

// ----- Define Vars -----
const pendingOrders = ref([]);

// Refs
const mainModal = ref(null);

// ----- Define Computed -----
const finalList = computed(() => {
  const list = [];

  pendingOrders.value.forEach((order) => {
    order.products.forEach((product) => {
      const index = list.findIndex((item) => item.productId === product.productId);

      if (index === -1) {
        list.push({ ...product, finalQuantity: product.quantity });
      } else {
        list[index].finalQuantity += product.quantity;
      }
    });
  });

  return list;
});

// ----- Define Methods -----
function sendListMessage() {
  // Clean the client's phone number to contain only numbers
  const cleanPhone = 3513545369; // Meli's number

  // Message creation
  let message = "Lista de productos que necesitamos comprar:\n\n";

  finalList.value.forEach((product) => {
    message += `- ${product.productName} (${product.unit}) - ${product.finalQuantity}\n`;
  });

  // Send message to wsp
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  // Open message in a new window
  window.open(url, "_blank");
}

// ----- Define Methods -------
const showStockList = (orders) => {
  if (!mainModal.value) {
    useToast("error", "Parece que hay un error en el sistema, por favor intenta nuevamente.");
    return;
  }

  console.log(orders);

  // This is the only way to make it work, otherwise it will be a reference since there are many nested objects
  pendingOrders.value = JSON.parse(JSON.stringify(orders));

  // Show modal
  mainModal.value.showModal();
};

// ----- Define Hooks -----

// ----- Define Watchers -----

// ----- Define Expose -----
defineExpose({ showStockList });
</script>
