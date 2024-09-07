<template>
  <div class="flex flex-col gap-[2rem] w-full mt-[1.429rem]" v-if="doesOrderExist">
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
            <span class="text-sm">Cantidad: {{ p.quantity }}</span>
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
      <span class="font-semibold">Datos del cliente</span>
      <div class="flex flex-col gap-1">
        <span>Nombre</span>
        <input v-model="client.name" type="text" placeholder="Ej: Verduleria Carlos" />
      </div>
      <div class="flex flex-col gap-1">
        <span>Telefono</span>
        <input v-model="client.phone" type="text" placeholder="Numero de telefono" />
      </div>
      <div class="flex flex-col gap-1">
        <span>Direccion</span>
        <input v-model="client.address" type="text" placeholder="Direccion de reparto" />
      </div>
    </div>
    <div class="flex justify-between items-center gap-3">
      <span class="font-bold text-xl">Total: {{ formatPrice(totalAmount) }}</span>
      <button
        @click="confirmBuying"
        class="flex-1 btn bg-primary text-white flex items-center gap-2 justify-center text-nowrap text-start"
      >
        <MingcuteWhatsappLine class="text-xl" /> Confirmar Pedido
      </button>
    </div>
  </div>
  <div class="flex flex-col gap-[2rem] w-full mt-[1.429rem]" v-else>
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
</template>

<script setup>
import MingcuteWhatsappLine from "~icons/mingcute/whatsapp-line";
import TablerTrash from "~icons/tabler/trash";
import IonArrowBack from "~icons/ion/arrow-back";
import { ToastEvents } from "~/interfaces";

// ------- Define Pinia Vars --------
const ordersStore = useOrdersStore();
const { doesOrderExist, getShoppingCart: products, totalAmount } = storeToRefs(ordersStore);

// ------- Define Vars --------
const client = ref({
  name: "",
  phone: "",
  address: ""
});
const shippingPrice = ref(null);

// ------- Define Methods --------
function confirmBuying() {
  // Clean phone, keep only numbers
  const cleanPhone = client.value.phone.replace(/\D/g, "");

  console.log(cleanPhone);

  // Message creation
  const message = createMessage(products.value, client.value.address, totalAmount.value);

  // Send message to wsp
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  // Open message in a new window
  window.open(url, "_blank");
}

function createMessage(products, address, totalAmount) {
  // Verify address or add "N/A" if empty
  const deliveryAddress = address ? address : "N/A";

  // Start message with an empty string
  let message = "";

  // Loop through products and format each entry according to the desired style
  products.forEach((product) => {
    const productPrice = formatPrice(product.price);

    // Check if the quantity is fractional (e.g., "1/2" for half quantities)
    const quantityText = product.quantity % 1 === 0 ? product.quantity : `${product.quantity * 2}/2`;

    message += `${quantityText} ${product.productName} ${productPrice}\n`;
  });

  // Add delivery cost if necessary (assuming the delivery cost is a separate value)
  const deliveryCost = shippingPrice.value ?? 1000; // Example value, adjust or pass it dynamically if needed
  message += `Envío ${formatPrice(deliveryCost)}\n`;

  // Add the total amount at the end of the message
  message += `\n${formatPrice(totalAmount)}\n`;

  // Add delivery address
  message += `\n${deliveryAddress}\n`;

  return message;
}
function removeFromShopping(product) {
  ordersStore.removeProduct(product);

  useToast(ToastEvents.success, "Producto eliminado del carrito.");
}

useHead({
  title: "Completar Compra",
  meta: [
    {
      name: "description",
      content: "Aplicacion web para la compra de bebidas de todo tipo."
    }
  ]
});
</script>
