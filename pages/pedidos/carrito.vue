<template>
  <div class="flex flex-col gap-[2rem] w-full mt-[1.429rem]" v-if="doesOrderExist && !orderCreated">
    <div class="flex items-center gap-2">
      <NuxtLink
        to="/pedidos/nuevo"
        class="btn bg-secondary border-2 border-primary flex justify-start items-center font-semibold gap-2"
      >
        <IonArrowBack class="text-[1rem]" /> Agregar mas productos
      </NuxtLink>
    </div>
    <div class="flex flex-col gap-1">
      <div v-for="p in products" class="flex gap-4 items-center p-2 border rounded-lg shadow w-full items-start">
        <div class="w-full h-full flex flex-col justify-start gap-1">
          <span class="font-semibold">{{ p.productName }}</span>
          <div class="flex flex-col">
            <span class="text-sm">Cantidad: {{ formatQuantity(p.quantity) }}</span>
            <span class="text-sm">Precio Unitario: {{ formatPrice(p.price) }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="font-bold">{{ formatPrice(p.total) }}</span>
            <button @click="removeFromShopping(p)" class="btn bg-danger">
              <TablerTrash class="text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-2">
      <span class="font-semibold">Costo de envio</span>
      <div class="flex flex-col gap-1">
        <input v-model="shippingPrice" type="number" placeholder="Ej: 1000" />
      </div>
    </div>
    <div class="flex flex-col gap-2">
      <span class="font-semibold">Agrega nuevo cliente o selecciona un existente</span>
      <Autocomplete
        :items="clients"
        property="clientName"
        placeholder="Busca con el nombre del cliente"
        returnValue="id"
        @selected="selectClient"
        @unselect="onUnselect"
      />
      <div class="flex flex-col gap-1">
        <span>Nombre</span>
        <input :disabled="clientSelected" v-model="client.clientName" type="text" placeholder="Ej: Verduleria Carlos" />
      </div>
      <div class="flex flex-col gap-1">
        <span>Telefono</span>
        <input :disabled="clientSelected" v-model="client.phone" type="text" placeholder="Numero de telefono" />
      </div>
      <div class="flex flex-col gap-1">
        <span>Direccion</span>
        <input :disabled="clientSelected" v-model="client.address" type="text" placeholder="Direccion de reparto" />
      </div>
    </div>
    <button
      @click="saveClient"
      :disabled="clientSelected"
      class="flex items-center gap-2 btn bg-secondary shadow ring-1 ring-primary w-fit hover:bg-primary hover:text-white"
    >
      <TablerPlus />
      Guardar nuevo cliente
    </button>
    <div class="flex flex-col text-red-500" v-if="clientError.alreadyExists">
      <span
        >Ya existe un cliente con esta informacion (misma dirección o teléfono). El cliente tiene los siguientes
        datos:</span
      >
      <span class="font-semibold">Nombre: {{ clientError.clientName }}</span>
      <span class="font-semibold">Teléfono: {{ clientError.phone }}</span>
      <span class="font-semibold">Direccón: {{ clientError.address }}</span>
    </div>
    <div class="flex justify-between items-center gap-3">
      <span class="font-bold text-xl">Total: {{ formatPrice(totalWithShipping) }}</span>
      <button
        @click="confirmOrder"
        class="flex-1 btn bg-primary text-white flex items-center gap-2 justify-center text-nowrap text-start max-w-[30rem]"
      >
        Confirmar Pedido
      </button>
    </div>
  </div>
  <div class="flex flex-col gap-[2rem] w-full mt-[1.429rem]" v-else-if="!orderCreated">
    <div class="flex items-center gap-2">
      <NuxtLink
        to="/pedidos/nuevo"
        class="btn bg-secondary border-2 border-primary flex justify-start items-center font-semibold gap-2"
      >
        <IonArrowBack class="text-[1rem]" /> Nuevo Pedido
      </NuxtLink>
    </div>
    <p>Carrito vacio.</p>
  </div>
  <div v-else class="w-full flex flex-col gap-[2rem] flex-1 min-h-full justify-center">
    <div class="flex flex-col items-center gap-[1rem]">
      <IconParkOutlineCheckOne class="text-[3rem] text-success" />
      <span class="text-[2rem] font-semibold text-center">¡Pedido Creado!</span>
    </div>
    <div class="flex flex-col gap-4">
      <span class="text-[1.143rem] text-gray-600 text-center">Esta listo en la lista de pedidos</span>
      <div class="flex flex-col gap-3">
        <NuxtLink to="/pedidos/nuevo" class="btn bg-primary text-white text-center">Agregar otro pedido</NuxtLink>
        <button
          @click="sendConfirmationMessage"
          class="flex items-center justify-center gap-2 btn bg-secondary w-full text-center ring-1 ring-gray-300"
        >
          <MingcuteWhatsappLine class="text-xl" />
          Enviar mensaje al cliente
        </button>
        <NuxtLink to="/pedidos" class="btn bg-secondary w-full text-center ring-1 ring-gray-300">Ver pedidos</NuxtLink>
      </div>
    </div>
  </div>
  <Loader v-if="loading" />
</template>

<script setup>
import TablerPlus from "~icons/tabler/plus";
import MingcuteWhatsappLine from "~icons/mingcute/whatsapp-line";
import TablerTrash from "~icons/tabler/trash";
import IonArrowBack from "~icons/ion/arrow-back";
import { ToastEvents } from "~/interfaces";

// ------- Define Pinia Vars --------
const clientsStore = useClientsStore();
clientsStore.fetchData();
const { clients } = storeToRefs(clientsStore);

const ordersStore = useOrdersStore();
const { doesOrderExist, getShoppingCart: products, totalAmount } = storeToRefs(ordersStore);

// ------- Define Vars --------
const client = ref({
  clientName: "",
  phone: "",
  address: ""
});
const loading = ref(false);
const clientError = ref({
  alreadyExists: false,
  clientName: false,
  phone: false,
  address: false
});
const shippingPrice = ref(null);
const clientSelected = ref(false);
const orderCreated = ref(false);

// ------- Define Computed --------
const totalWithShipping = computed(() => totalAmount.value + (shippingPrice.value ?? 0));

// ------- Define Methods --------
function sendConfirmationMessage() {
  // Clean phone, keep only numbers
  const cleanPhone = 3513545369; // Meli's phone number

  // Message creation
  const message = createMessage(products.value, client.value.address);

  // Send message to wsp
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  // Open message in a new window
  window.open(url, "_blank");
}

function saveClient() {
  // Check if loading
  if (loading.value) return;

  loading.value = true;

  // Validate client information
  const isClientValid = validateClient(client.value);

  if (!isClientValid) {
    useToast(ToastEvents.error, "Por favor, complete la información del cliente.");
    loading.value = false;
    return;
  }

  // If client is valid, check if it exists already
  let clientToSave = clients.value.find((c) => {
    return c.address === client.value.address || c.phone === client.value.phone;
  });

  // Add client if it doesn't exist
  if (!clientToSave) {
    clientToSave = clientsStore.addClient(client.value);
    if (clientToSave) {
      useToast(ToastEvents.success, "Cliente agregado correctamente.");
      loading.value = false;
      clientError.value = {
        alreadyExists: false,
        clientName: false,
        phone: false,
        address: false
      };
      return;
    } else {
      useToast(ToastEvents.error, "Error al agregar el cliente. Por favor, intente de nuevo.");
      loading.value = false;
      return;
    }
  }

  // If client exists, add a warning error
  useToast(ToastEvents.error, "El cliente ya existe en la base de datos.");
  // Update client error object
  clientError.value = {
    alreadyExists: true,
    clientName: clientToSave.clientName,
    phone: clientToSave.phone,
    address: clientToSave.address
  };

  loading.value = false;
}

async function confirmOrder() {
  // Check if loading
  if (loading.value) return;

  loading.value = true;
  // Check client information again
  const isClientValid = validateClient(client.value);

  if (!isClientValid) {
    useToast(ToastEvents.error, "Por favor, complete la información del cliente.");
    loading.value = false;
    return;
  }

  // Check if shipping price is valid
  if (!shippingPrice.value) {
    useToast(ToastEvents.error, "Por favor, complete el costo de envío.");
    loading.value = false;
    return;
  }

  // Double check products still exits
  if (!products.value.length) {
    useToast(ToastEvents.error, "No hay productos en el carrito.");
    loading.value = false;
    return;
  }

  // Place the order
  await ordersStore.placeOrder({
    products: products.value,
    shippingPrice: shippingPrice.value,
    client: client.value,
    pedidoStatus: "pending"
  });

  // Show success message
  useToast(ToastEvents.success, "Pedido creado correctamente.");
  orderCreated.value = true;
  loading.value = false;
}

function createMessage(products) {
  // Verify if the address is empty
  const deliveryAddress = client.value.address ? client.value.address : "N/A";

  // Add the introduction name
  let message = `¡Hola, ${client.value.clientName}! 👋\nTu pedido está completo, estos son los detalles:\n\n`;

  products.forEach((product) => {
    const productPrice = formatPrice(product.price);

    // Verify if it's a fraction and add 1/4, 1/2 or 3/4 accordingly
    const quantityText = formatQuantity(product.quantity);

    message += `- ${quantityText} ${product.productName} ${productPrice}\n`;
  });

  // Añade el costo de envío
  message += `\n🚚 Costo de Envío: ${formatPrice(shippingPrice.value)}\n`;

  // Añade el total
  message += `💵 Total a Pagar: ${formatPrice(totalWithShipping.value)}\n`;

  // Añade la dirección de envío
  message += `\n📍 Dirección de Envío: ${deliveryAddress}\n`;

  // Cierra con un mensaje amigable
  message += `\n¡Gracias por tu compra! Si necesitas algo más, no dudes en avisarnos. 😊`;

  return message;
}

function removeFromShopping(product) {
  ordersStore.removeProduct(product);

  useToast(ToastEvents.success, "Producto eliminado del carrito.");
}

function selectClient(clientId) {
  const selectedClient = clients.value.find((c) => c.id === clientId);

  if (!selectedClient) {
    useToast(ToastEvents.error, "Cliente no encontrado. Por favor, intente de nuevo.");

    // Clean the client object
    client.value = {
      clientName: "",
      phone: "",
      address: ""
    };

    clientSelected.value = false;

    return;
  }

  client.value = {
    clientName: selectedClient.clientName,
    phone: selectedClient.phone,
    address: selectedClient.address
  };

  clientSelected.value = true;
}

function onUnselect() {
  clientSelected.value = false;
}

useHead({
  title: "Confirmar Pedido"
});
</script>
