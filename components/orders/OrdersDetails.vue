<template>
  <ModalStructure ref="mainModal">
    <template #header>
      <div class="flex flex-col gap-2 w-full">
        <div class="flex flex-col cursor-pointer w-full">
          <span class="font-bold text-xl">Detalles del pedido</span>
        </div>
        <div class="flex flex-col cursor-pointer w-full">
          <span class="text-xs text-gray-500">Pedido id: {{ currentOrder.id }}</span>
        </div>
      </div>
    </template>
    <template #default>
      <!-- 
        <FormKit
          type="form"
          id="ventas-nuevo"
          :form-class="'flex flex-col gap-4 w-full'"
          submit-label="Nueva Venta"
          @submit="updateSell"
          :actions="false"
        >
          <FormKit
            type="number"
            name="quantity"
            label-class="font-medium"
            messages-class="text-red-500 text-[0.75rem]"
            input-class="w-full"
            label="Cantidad"
            placeholder="Cantidad por unidad de venta"
            validation="required"
            v-model="form.quantity"
          />
          <FormKit
            type="number"
            name="buying_price"
            label-class="font-medium"
            messages-class="text-red-500 text-[0.75rem]"
            input-class="w-full"
            label="Precio de compra por unidad"
            placeholder="$$$"
            validation="required"
            v-model="form.buyingPrice"
          />
          <FormKit
            type="number"
            name="selling_price"
            label-class="font-medium"
            messages-class="text-red-500 text-[0.75rem]"
            input-class="w-full"
            label="Precio de venta por unidad"
            placeholder="$$$"
            validation="required"
            v-model="form.sellingPrice"
          />
          <FormKit
            type="date"
            name="sell_date"
            label-class="font-medium"
            messages-class="text-red-500 text-[0.75rem]"
            input-class="w-full"
            label="Fecha de venta"
            placeholder="yyyy-mm-dd"
            validation="required"
            v-model="form.date"
          />
          <div class="flex flex-col gap-[0.143rem]">
            <span class="font-medium">Calidad del producto</span>
            <span class="font-medium text-xs text-danger" v-if="!form.quality">(no seleccionado)</span>
            <div class="flex gap-2 justify-between m-1">
              <div class="flex-1 w-full">
                <input v-model="form.quality" class="hidden" type="radio" id="baja" name="quality" value="baja" checked />
                <label
                  :class="{
                    'ring-2 ring-primary': form.quality === 'baja'
                  }"
                  class="flex items-center gap-2 btn bg-secondary text-nowrap inline-block w-full text-center"
                  for="baja"
                >
                  <AkarIconsCircleXFill class="text-[1.285rem] text-danger" />
                  <span>Baja</span>
                </label>
              </div>

              <div class="flex-1 w-full">
                <input
                  v-model="form.quality"
                  class="hidden"
                  type="radio"
                  id="intermedia"
                  name="quality"
                  value="intermedia"
                />
                <label
                  :class="{
                    'ring-2 ring-primary': form.quality === 'intermedia'
                  }"
                  class="flex items-center gap-2 btn bg-secondary text-nowrap inline-block w-full text-center"
                  for="intermedia"
                >
                  <FluentStarHalf12Regular class="text-[1.428rem] text-[#fcd53f]" />
                  <span>Intermedia</span>
                </label>
              </div>

              <div class="flex-1 w-full">
                <input v-model="form.quality" class="hidden" type="radio" id="buena" name="quality" value="buena" />
                <label
                  :class="{
                    'ring-2 ring-primary': form.quality === 'buena'
                  }"
                  class="flex items-center gap-2 btn bg-secondary text-nowrap inline-block w-full text-center"
                  for="buena"
                >
                  <IconoirStarSolid class="text-[1.285rem] text-[#fcd53f]" />
                  <span>Buena</span>
                </label>
              </div>
            </div>
          </div>
        </FormKit> 
      -->
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <span class="font-semibold text-lg">Resumen del pedido</span>
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
              <tr class="text-center border-b" v-for="product in currentOrder.products" :key="product.id">
                <td class="py-3 text-start">{{ product.productName }}</td>
                <td class="py-3">{{ formatPrice(product.price) }}</td>
                <td class="py-3">{{ product.quantity }}</td>
                <td class="py-3">{{ formatPrice(product.total) }}</td>
              </tr>
              <tr class="text-center border-b">
                <td class="py-3 text-start">Envío</td>
                <td class="py-3"></td>
                <td class="py-3"></td>
                <td class="py-3">{{ formatPrice(currentOrder.shippingPrice) }}</td>
              </tr>
              <tr class="text-center border-b font-bold">
                <td class="py-3 text-start">Total</td>
                <td class="py-3"></td>
                <td class="py-3"></td>
                <td class="py-3">{{ formatPrice(currentOrder.totalAmount ?? 0) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex flex-col gap-2">
          <span class="font-semibold text-lg">Datos del cliente</span>
          <div class="flex gap-1">
            <span class="font-medium">Nombre:</span>
            <span>{{ currentOrder.client.clientName }}</span>
          </div>
          <div class="flex gap-1">
            <span class="font-medium">Teléfono:</span>
            <span>{{ currentOrder.client.phone }}</span>
          </div>
          <div class="flex gap-1">
            <span class="font-medium">Dirección:</span>
            <span>{{ currentOrder.client.address ?? "N/A" }}</span>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <span class="font-semibold text-lg">Fecha de envío</span>
          <span class="">{{ formattedDate(currentOrder.shippingDate) }} </span>
        </div>
      </div>
    </template>
    <template #footer>
      <div v-if="submitting" class="btn bg-secondary border text-center">loading...</div>
      <button
        v-else
        @click="showModalUpdate()"
        class="flex-1 w-full text-nowrap flex items-center justify-center gap-2 btn bg-secondary w-full text-center ring-1 ring-gray-300"
      >
        <LucideEdit /> Modificar
      </button>
      <div v-if="submitting" class="btn bg-danger text-white text-nowrap">loading...</div>
      <button
        v-else
        @click="markAsCancelled()"
        class="flex items-center justify-center gap-2 btn bg-danger text-white text-nowrap hover:ring-2 hover:ring-red-500"
      >
        <IcRoundArchive /> Cancelar venta
      </button>
      <button
        @click="sendConfirmationMessage"
        class="flex-1 w-full text-nowrap flex items-center justify-center gap-2 btn bg-secondary w-full text-center ring-1 ring-gray-300"
      >
        <MingcuteWhatsappLine class="text-xl" />
        Enviar mensaje al cliente
      </button>
    </template>
  </ModalStructure>
  <Loader v-if="submitting" />
  <ConfirmDialogue ref="confirmDialogue" />
</template>

<script setup>
import MingcuteWhatsappLine from "~icons/mingcute/whatsapp-line";
import LucideEdit from "~icons/lucide/edit";
import IcRoundArchive from "~icons/ic/round-archive";
import { ToastEvents } from "~/interfaces";

// ----- Define Pinia Vars -----
const ordersStore = useOrdersStore();
const { getPendingOrders: pendingOrders, arePendingOrdersFetched } = storeToRefs(ordersStore);

// ----- Define Vars -----
const submitting = ref(false);
const currentOrder = ref(null);
const currentProduct = ref(null);
const form = ref({
  quantity: 0,
  quality: false,
  buyingPrice: 0,
  sellingPrice: 0,
  date: ""
});

// Refs
const mainModal = ref(null);
const confirmDialogue = ref(null);

// ----- Define Methods -----
async function showModalUpdate() {
  useToast(ToastEvents.info, "No implementado todavía");
}

async function markAsCancelled() {
  useToast(ToastEvents.info, "No implementado todavía");
}

function sendConfirmationMessage() {
  // Clean the client's phone number to contain only numbers
  const cleanPhone = currentOrder.value.client.phone.replace(/\D/g, "");

  // Message creation
  const message = createMessage(
    currentOrder.value.products,
    currentOrder.value.client,
    currentOrder.value.shippingPrice,
    currentOrder.value.totalAmount
  );

  // Send message to wsp
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  // Open message in a new window
  window.open(url, "_blank");
}

const showModal = (orderId) => {
  // Check sells are fetched
  if (!arePendingOrdersFetched.value) {
    useToast("error", "Parece que los pedidos no han sido cargados aún, por favor intenta nuevamente.");
    return;
  }

  if (!mainModal.value) {
    useToast("error", "Parece que hay un error en el sistema, por favor intenta nuevamente.");
    return;
  }

  // Based on the orderId, we will get the sell data and fill the form
  const order = pendingOrders.value.find((o) => o.id === orderId);

  // Check if order exists
  if (!order) {
    useToast("error", "Parece que la venta no existe, por favor intenta nuevamente.");
    return;
  }

  // Set current order
  currentOrder.value = order;

  // Fill form

  // Show modal
  mainModal.value.showModal();
};

// ----- Define Hooks -----

// ----- Define Expose -----
defineExpose({ showModal });
</script>
