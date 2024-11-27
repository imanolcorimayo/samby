<template>
  <ModalStructure ref="mainModal">
    <template #header>
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center w-full gap-3">
        <div class="flex flex-col gap-2 w-full">
          <div class="flex flex-col cursor-pointer w-full">
            <span class="font-bold text-xl">Detalles del pedido</span>
          </div>
          <div class="flex flex-col cursor-pointer w-full">
            <span class="text-xs text-gray-500">Pedido id: {{ currentOrder.id }}</span>
          </div>
        </div>
        <span
          class="h-fit inline-flex items-center rounded-md px-2 py-1 font-semibold ring-1 ring-inset text-center text-nowrap"
          :class="{
            'bg-green-50 text-green-800 ring-green-600/20': currentOrder.orderStatus == 'entregado',
            'bg-red-50 text-red-800 ring-red-600/20': ['cancelado', 'rechazado'].includes(currentOrder.orderStatus),
            'bg-blue-50 text-blue-800 ring-blue-600/20': currentOrder.orderStatus == 'pendiente-de-confirmacion',
            'bg-yellow-50 text-yellow-800 ring-yellow-600/20': ['pendiente', 'pendiente-modificado'].includes(
              currentOrder.orderStatus
            )
          }"
        >
          {{ formatStatus(currentOrder.orderStatus) }}</span
        >
      </div>
    </template>
    <template #default>
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <span class="font-semibold text-lg">Resumen del pedido</span>
          <table>
            <thead>
              <tr class="text-gray-400 border-b">
                <th class="font-medium text-start">Producto</th>
                <th class="font-medium hidden sm:block">Precio</th>
                <th class="font-medium">Cantidad</th>
                <th class="font-medium flex flex-col items-center justify-center">
                  <span>Subtotal</span>
                  <span class="text-xs block sm:hidden">(p/ unidad)</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="text-center border-b" v-for="product in editableOrder.products" :key="product.id">
                <td class="py-3 text-start">{{ `${product.productName} (${product.unit})` }}</td>
                <td class="py-3 hidden sm:block">{{ formatPrice(product.price) }}</td>
                <td class="py-3">
                  <div class="flex justify-between items-center gap-2 w-full" v-if="isEditable">
                    <button
                      @click="manageProduct(product.productId, 'remove')"
                      class="btn-sm bg-secondary ring-1 ring-gray-500 max-h-[2rem]"
                    >
                      <MiRemove v-if="product.quantity > 1" class="text-black text-xs" />
                      <TablerTrash v-else class="text-black text-xs" />
                    </button>
                    <span
                      class="w-full bg-secondary text-sm py-[0.214rem] px-[0.428rem] rounded-[0.214rem] ring-1 ring-gray-500 text-center text-nowrap max-h-[2.143rem]"
                      >{{ product.quantity }}</span
                    >
                    <button
                      @click="manageProduct(product.productId, 'add')"
                      class="btn-sm bg-secondary ring-1 ring-gray-500 max-h-[2rem]"
                    >
                      <TablerPlus class="text-black text-xs" />
                    </button>
                  </div>
                  <span v-else>{{ product.quantity }}</span>
                </td>
                <td class="py-3">
                  <div class="flex flex-col items-center justify-center">
                    <span>{{ formatPrice(product.total) }}</span>
                    <span class="text-xs block sm:hidden">({{ formatPrice(product.price) }})</span>
                  </div>
                </td>
              </tr>
              <tr class="text-center border-b" v-if="isEditable">
                <td class="py-3 text-start">
                  <Autocomplete
                    :items="autocompleteProducts"
                    property="productNameWithUnit"
                    placeholder="+ Nuevo Producto"
                    returnValue="id"
                    clearOnSelect
                    @selected="addProduct"
                    @unselect="onUnselect"
                  />
                </td>
                <td class="py-3 hidden sm:block"></td>
                <td class="py-3"></td>
                <td class="py-3"></td>
              </tr>
              <tr class="text-center border-b">
                <td class="py-3 text-start">Envío</td>
                <td class="py-3 hidden sm:block"></td>
                <td class="py-3"></td>
                <td class="py-3 flex items-center gap-2 max-w-[10rem]">
                  $<input
                    v-model="editableOrder.shippingPrice"
                    type="number"
                    class="text-center"
                    placeholder="Ej: 1000"
                  />
                </td>
              </tr>
              <tr class="text-center border-b font-bold">
                <td class="py-3 text-start">Total</td>
                <td class="py-3 hidden sm:block"></td>
                <td class="py-3"></td>
                <td class="py-3">{{ formatPrice(editableOrder.totalAmount ?? 0) }}</td>
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
        <div class="flex-1 flex flex-col gap-2 w-fit">
          <FormKit
            type="date"
            name="shipping_date"
            label-class="font-medium"
            messages-class="text-red-500 text-[0.75rem]"
            input-class="w-fit"
            label="Fecha de envío"
            placeholder="yyyy-mm-dd"
            validation="required"
            v-model="editableOrder.shippingDate"
          />
        </div>
      </div>
    </template>
    <template #footer>
      <div v-if="submitting && isOrderModified && isEditable" class="btn bg-secondary border text-center">
        loading...
      </div>
      <button
        v-else-if="isOrderModified && isEditable"
        @click="modifyOrder()"
        class="flex-1 w-full text-nowrap flex items-center justify-center gap-2 btn bg-primary text-white w-full text-center"
      >
        <LucideEdit /> Modificar
      </button>
      <div class="flex justify-between gap-1" v-if="currentOrder.orderStatus !== 'pendiente-de-confirmacion'">
        <div
          v-if="submitting && !isOrderModified && isEditable"
          class="flex-1 flex items-center justify-center gap-2 btn bg-danger text-white text-nowrap"
        >
          loading...
        </div>
        <button
          v-else-if="!isOrderModified && isEditable"
          @click="updateStatus('cancelado')"
          class="flex-1 flex items-center justify-center gap-2 btn bg-danger text-white text-nowrap hover:ring-2 hover:ring-red-500"
        >
          <IcRoundArchive /> Cancelar venta
        </button>
        <div
          v-if="submitting && !isOrderModified && isEditable"
          class="flex-1 flex items-center justify-center gap-1 btn bg-primary text-white text-nowrap"
        >
          loading...
        </div>
        <button
          v-else-if="!isOrderModified && isEditable"
          @click="updateStatus('entregado')"
          class="flex-1 flex items-center justify-center gap-1 btn bg-primary text-white text-nowrap"
        >
          <IconParkOutlineCheckOne /> Marcar entregado
        </button>
      </div>
      <div class="flex justify-between gap-1" v-else>
        <div
          v-if="submitting && !isOrderModified && isEditable"
          class="flex-1 flex items-center justify-center gap-2 btn bg-danger text-white text-nowrap"
        >
          loading...
        </div>
        <button
          v-else-if="!isOrderModified && isEditable"
          @click="updateStatus('rechazado')"
          class="flex-1 flex items-center justify-center gap-2 btn bg-danger text-white text-nowrap hover:ring-2 hover:ring-red-500"
        >
          <IcRoundArchive /> Rechazar pedido
        </button>
        <div
          v-if="submitting && !isOrderModified && isEditable"
          class="flex-1 flex items-center justify-center gap-1 btn bg-primary text-white text-nowrap"
        >
          loading...
        </div>
        <button
          v-else-if="!isOrderModified && isEditable"
          @click="updateStatus('pendiente')"
          class="flex-1 flex items-center justify-center gap-1 btn bg-primary text-white text-nowrap"
        >
          <IconParkOutlineCheckOne /> Aceptar pedido
        </button>
      </div>
      <div class="flex justify-between gap-1">
        <button
          v-if="!isOrderModified && isEditable"
          @click="sendConfirmationMessage"
          class="flex-1 w-full text-nowrap flex items-center justify-center gap-2 btn bg-secondary w-full text-center ring-1 ring-gray-300"
        >
          <MingcuteWhatsappLine class="text-xl" />
          Resumen
        </button>
        <button
          v-if="!isOrderModified && isEditable"
          @click="sendEmptyMessage"
          class="flex-1 w-full flex items-center justify-center gap-2 btn bg-secondary w-full text-center ring-1 ring-gray-300"
        >
          <MingcuteWhatsappLine class="text-xl" /> Vacío
        </button>
      </div>
    </template>
  </ModalStructure>
  <Loader v-if="submitting" />
  <ConfirmDialogue ref="confirmDialogue" />
</template>

<script setup>
import TablerPlus from "~icons/tabler/plus";
import IconParkOutlineCheckOne from "~icons/icon-park-outline/check-one";
import MiRemove from "~icons/mi/remove";
import TablerTrash from "~icons/tabler/trash";
import MingcuteWhatsappLine from "~icons/mingcute/whatsapp-line";
import LucideEdit from "~icons/lucide/edit";
import IcRoundArchive from "~icons/ic/round-archive";
import { ToastEvents } from "~/interfaces";

// ----- Define Pinia Vars -----
const productsStore = useProductsStore();
const { products } = storeToRefs(productsStore);

const ordersStore = useOrdersStore();
const { getPendingOrders: pendingOrders, getOrders: orders, arePendingOrdersFetched } = storeToRefs(ordersStore);

productsStore.fetchData();

// ----- Define Vars -----
const submitting = ref(false);
const currentOrder = ref(null);
const currentOrderId = ref(null);
const editableOrder = ref([]);
const isOrderModified = ref(false);

// Refs
const mainModal = ref(null);
const confirmDialogue = ref(null);

// ----- Define Computed -----
const autocompleteProducts = computed(() => {
  // Filter out the product that are in the modifiedOrder
  const productsIds = editableOrder.value.products.map((p) => p.productId);
  const filteredProducts = products.value.filter((p) => !productsIds.includes(p.id));

  return filteredProducts.map((p) => {
    return {
      ...p,
      productNameWithUnit: `${p.productName} (${p.unit})`
    };
  });
});
const isEditable = computed(() => {
  return !["entregado", "cancelado", "rechazado"].includes(currentOrder.value.orderStatus);
});

// ----- Define Methods -----
async function updateStatus(status) {
  // Check the valid status
  if (!["pendiente", "pendiente-modificado", "entregado", "cancelado", "rechazado"].includes(status)) {
    useToast(ToastEvents.error, "El estado seleccionado no es válido, por favor intenta nuevamente");
    return;
  }

  // If submitting, do nothing
  if (submitting.value) return;

  // Start the loader
  submitting.value = true;

  // Confirm dialogue
  const confirmed = await confirmDialogue.value.openDialog({ edit: true });

  if (!confirmed) {
    submitting.value = false;
    return;
  }

  // Update the order
  const orderUpdated = await ordersStore.updateStatusOrder(currentOrder.value.id, status);

  if (orderUpdated) {
    useToast(ToastEvents.success, `Pedido marcado como "${status}" correctamente`);
    mainModal.value.closeModal();
    submitting.value = false;
  } else {
    useToast(
      ToastEvents.error,
      `Hubo un error marcar el pedido como "${status}" el pedido, por favor intenta nuevamente`
    );
    submitting.value = false;
  }
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

function sendEmptyMessage() {
  // Clean the client's phone number to contain only numbers
  const cleanPhone = currentOrder.value.client.phone.replace(/\D/g, "");

  // Message creation
  const message = "";

  // Send message to wsp
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  // Open message in a new window
  window.open(url, "_blank");
}

// ----- Define Methods -------
function manageProduct(productId, action) {
  // Find index of the product
  const productIndex = editableOrder.value.products.findIndex((p) => p.productId === productId);

  // Find product in products
  const productFullInfo = products.value.find((p) => p.id === productId);
  const productStep = productFullInfo.step ?? 0.5;

  // Edit product by reference
  const product = editableOrder.value.products[productIndex];

  if (action === "add") {
    // Add quantity
    product.quantity = product.quantity + productStep;
    product.total = product.price * product.quantity;

    // Update total
    updateOrderFinancial();
    return;
  }

  // If it's the last product, remove it and unselect it
  if (product.quantity <= productStep) {
    // Remove product from the list using the index
    editableOrder.value.products.splice(productIndex, 1);
  }

  // Manage remove action
  product.quantity = product.quantity - productStep;
  product.total = product.price * product.quantity;
  updateOrderFinancial();
}

function addProduct(productId) {
  // Get product properties
  const product = products.value.find((p) => p.id === productId);

  // Check if product exists
  if (!product) {
    useToast("error", "El producto no existe, por favor intenta nuevamente.");
    return;
  }

  // Check if product is already in the list
  if (editableOrder.value.products.find((p) => p.productId === product.id)) {
    useToast("error", "El producto ya ha sido agregado, por favor intenta nuevamente.");
    return;
  }

  // Add product to the list
  editableOrder.value.products.push({
    productId: product.id,
    productName: product.productName,
    price: product.price,
    quantity: product.step ?? 0.5,
    total: product.price * (product.step ?? 0.5),
    unit: product.unit
  });

  // Update the total amount
  updateOrderFinancial();
}

function updateOrderFinancial() {
  // Update the total products amount
  editableOrder.value.totalProductsAmount = editableOrder.value.products.reduce((acc, product) => {
    return acc + product.total;
  }, 0);

  // Update the total amount
  editableOrder.value.totalAmount = editableOrder.value.totalProductsAmount + editableOrder.value.shippingPrice;
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
  const order = [...pendingOrders.value, ...orders.value].find((o) => o.id === orderId);

  // Check if order exists
  if (!order) {
    useToast("error", "Parece que la venta no existe, por favor intenta nuevamente.");
    return;
  }

  // Set current order
  currentOrder.value = order;
  currentOrderId.value = orderId;

  // This is the only way to make it work, otherwise it will be a reference since there are many nested objects
  editableOrder.value = JSON.parse(JSON.stringify(order));

  // Show modal
  mainModal.value.showModal();
};

async function modifyOrder() {
  // If submitting, do nothing
  if (submitting.value) return;

  // Start the loader
  submitting.value = true;

  // Validate the editableOrder has products
  if (editableOrder.value.products.length === 0) {
    useToast(ToastEvents.error, "El pedido debe tener al menos un producto, por favor intenta nuevamente");
    submitting.value = false;
    return;
  }

  // Confirm dialogue
  const confirmed = await confirmDialogue.value.openDialog({ edit: true });

  if (!confirmed) {
    submitting.value = false;
    return;
  }

  // Update the order
  const orderUpdated = await ordersStore.updatePendingOrder(editableOrder.value);

  if (orderUpdated) {
    useToast(ToastEvents.success, "Pedido modificado correctamente");
    mainModal.value.closeModal();
    // Show the updated order
    showModal(currentOrderId.value);
    submitting.value = false;
  } else {
    useToast(ToastEvents.error, "Hubo un error al modificar el pedido, por favor intenta nuevamente");
    submitting.value = false;
  }
}

// ----- Define Hooks -----

// ----- Define Watchers -----
watch(
  [currentOrder, editableOrder],
  (newValues) => {
    isOrderModified.value = JSON.stringify(newValues[0]) !== JSON.stringify(newValues[1]);
  },
  { deep: true }
);

// ----- Define Expose -----
defineExpose({ showModal });
</script>
