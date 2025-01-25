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

    <div v-if="currentBusiness.shippingType === BUSINESS_SHIPPING_TYPES_UTILS.both">
      <FormKit
        type="select"
        name="shipping_type"
        :options="ORDER_SHIPPING_TYPES"
        label-class="font-medium"
        messages-class="text-red-500 text-[0.75rem]"
        :input-class="`w-full ${!shippingType ? 'text-gray-500' : ''}`"
        outer-class="w-full flex-1"
        label="Elegí el método de envío"
        placeholder="Elejí una opción"
        v-model="shippingType"
      />
    </div>
    <div class="flex flex-col md:flex-row justify-between gap-4">
      <div
        class="flex-1 flex flex-col justify-between w-full"
        v-if="currentBusiness.shippingType !== BUSINESS_SHIPPING_TYPES_UTILS.pickup"
      >
        <span class="font-semibold">Costo de envio</span>
        <input
          v-model="shippingPrice"
          type="number"
          placeholder="Ej: 1000"
          :disabled="shippingType === ORDER_SHIPPING_TYPES_UTILS.pickup"
        />
      </div>
      <div class="flex-1 flex flex-col gap-2 w-full">
        <span
          v-if="currentBusiness.shippingType == BUSINESS_SHIPPING_TYPES_UTILS.pickup"
          class="text-blue-500 font-medium"
          >* Tu local esta configurado para retiros en el local únicamente</span
        >
        <FormKit
          type="date"
          name="shipping_date"
          label-class="font-medium"
          messages-class="text-red-500 text-[0.75rem]"
          input-class="w-full"
          label="Fecha de entrega"
          placeholder="yyyy-mm-dd"
          validation="required"
          v-model="shippingDate"
        />
      </div>
    </div>
    <div class="flex flex-col gap-2">
      <span class="font-semibold">Agrega nuevo cliente o selecciona un existente</span>
      <Autocomplete
        :items="formattedClients"
        property="clientName"
        subItemProperty="address"
        placeholder="Busca con el nombre del cliente"
        returnValue="id"
        @selected="selectClient"
        @unselect="onUnselect"
      />
      <div class="flex flex-col p-3 gap-3 bg-secondary rounded-lg">
        <div class="flex flex-col gap-1">
          <span>Nombre</span>
          <input
            :disabled="clientSelected"
            v-model="client.clientName"
            type="text"
            placeholder="Ej: Verduleria Carlos"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span>Telefono</span>
          <input
            :disabled="clientSelected"
            @input="() => (client.phone = formatPhoneNumber(client.phone))"
            maxlength="20"
            v-model="client.phone"
            type="text"
            placeholder="Numero de telefono"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span>Direccion</span>
          <input :disabled="clientSelected" v-model="client.address" type="text" placeholder="Direccion de reparto" />
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
      </div>
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
  <Loader v-if="loading" />
</template>

<script setup>
import TablerPlus from "~icons/tabler/plus";
import TablerTrash from "~icons/tabler/trash";
import IonArrowBack from "~icons/ion/arrow-back";
import { ToastEvents } from "~/interfaces";

// ------- Define Useful Properties --------
const { $dayjs } = useNuxtApp();

// ------- Define Pinia Vars --------
const clientsStore = useClientsStore();
clientsStore.fetchData();
const { clients } = storeToRefs(clientsStore);

const indexStore = useIndexStore();
indexStore.fetchBusinesses();
const { getCurrentBusiness: currentBusiness } = storeToRefs(indexStore);

const ordersStore = useOrdersStore();
const { doesOrderExist, getShoppingCart: products, totalAmount } = storeToRefs(ordersStore);

// ------- Define Vars --------
const client = ref({
  clientName: "",
  phone: "",
  address: ""
});
const clientId = ref(null);
const loading = ref(false);
const clientError = ref({
  alreadyExists: false,
  clientName: false,
  phone: false,
  address: false
});

let initialShippingTypeValue = "";
let initialShippingPriceValue = currentBusiness.value.shippingPrice ?? 0;
if (currentBusiness.value.shippingType === BUSINESS_SHIPPING_TYPES_UTILS.both) {
  initialShippingTypeValue = "";
} else if (currentBusiness.value.shippingType === BUSINESS_SHIPPING_TYPES_UTILS.delivery) {
  initialShippingTypeValue = ORDER_SHIPPING_TYPES_UTILS.delivery;
} else if (currentBusiness.value.shippingType === BUSINESS_SHIPPING_TYPES_UTILS.pickup) {
  initialShippingTypeValue = ORDER_SHIPPING_TYPES_UTILS.pickup;
  initialShippingPriceValue = 0;
}
const shippingType = ref(initialShippingTypeValue);

const shippingPrice = ref(initialShippingPriceValue);
// Set for today
const shippingDate = ref($dayjs().format("YYYY-MM-DD"));
const clientSelected = ref(false);
const orderCreated = ref(false);

// ------- Define Computed --------
const totalWithShipping = computed(() => {
  // Ensure both values are numbers
  shippingPrice.value = parseFloat(shippingPrice.value || 0);

  return totalAmount.value + shippingPrice.value;
});
const formattedClients = computed(() => {
  return clients.value.map((cl) => {
    return {
      ...cl,
      clientName: `${cl.clientName} ${cl.fromEmprendeVerde ? "(Desde app de compras)" : "(Creado manualmente)"}`
    };
  });
});

// ------- Define Methods --------
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

      // It returns the saved client in Firestore, so it contains the ID
      clientId.value = clientToSave.id;
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

  // It can be null, so we just ensure it's a number and equal to 0
  if (!shippingPrice.value) {
    shippingPrice.value = 0;
  }

  // Check if shipping date is valid
  if (!shippingDate.value) {
    useToast(ToastEvents.error, "Por favor, complete la fecha de entrega.");
    loading.value = false;
    return;
  }

  // Double check products still exits
  if (!products.value.length) {
    useToast(ToastEvents.error, "No hay productos en el carrito.");
    loading.value = false;
    return;
  }

  // Place the order. Current business is is managed internally
  const orderObject = await ordersStore.placeOrder(
    {
      products: products.value,
      shippingPrice: shippingPrice.value,
      shippingDate: shippingDate.value,
      client: client.value,
      totalAmount: totalWithShipping.value,
      totalProductsAmount: totalAmount.value,
      shippingType: shippingType.value,
      orderStatus: "pendiente"
    },
    clientId.value
  );

  // Check if it was successful
  if (orderObject) {
    // Show success message
    useToast(ToastEvents.success, "Pedido creado correctamente.");
    orderCreated.value = true;
    navigateTo("/pedidos/confirmado");
  }

  loading.value = false;
}

function removeFromShopping(product) {
  ordersStore.removeProduct(product);

  useToast(ToastEvents.success, "Producto eliminado del carrito.");
}

function selectClient(cId) {
  const selectedClient = clients.value.find((c) => c.id === cId);

  if (!selectedClient) {
    useToast(ToastEvents.error, "Cliente no encontrado. Por favor, intente de nuevo.");

    // Clean the client object
    client.value = {
      clientName: "",
      phone: "",
      address: ""
    };

    clientId.value = null;

    clientSelected.value = false;

    return;
  }

  client.value = {
    clientName: selectedClient.clientName,
    phone: selectedClient.phone,
    address: selectedClient.address,
    fromEmprendeVerde: Boolean(selectedClient.fromEmprendeVerde)
  };

  clientId.value = cId;

  clientSelected.value = true;
}

function onUnselect() {
  clientSelected.value = false;
}

watch(shippingType, (newVal) => {
  if (newVal === ORDER_SHIPPING_TYPES_UTILS.pickup) {
    shippingPrice.value = 0;
  } else if (newVal === ORDER_SHIPPING_TYPES_UTILS.delivery) {
    shippingPrice.value = currentBusiness.value.shippingPrice ?? 0;
  }
});

useHead({
  title: "Confirmar Pedido"
});
</script>
