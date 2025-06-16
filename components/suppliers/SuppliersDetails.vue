<template>
  <ModalStructure ref="mainModal">
    <template #header>
      <div class="flex flex-col gap-2 w-full">
        <div class="flex flex-col w-full">
          <span class="font-semibold text-xl">{{ isNewSupplier ? "Nuevo Proveedor" : "Editar Proveedor" }}</span>
          <span class="text-gray-500" v-if="!isNewSupplier">{{ currentSupplier.name }}</span>
        </div>
      </div>
    </template>
    <template #default>
      <FormKit
        type="form"
        id="supplier-form"
        :form-class="`flex flex-col gap-4 w-full ${submitted ? 'hidden' : ''}`"
        :submit-label="isNewSupplier ? 'Agregar' : 'Actualizar'"
        @submit="handleSubmit"
        :actions="false"
      >
        <!-- Basic Information -->
        <FormKit
          type="text"
          name="name"
          input-class="w-full"
          label-class="font-medium"
          messages-class="text-red-500 text-[0.75rem]"
          label="Nombre del proveedor"
          placeholder="Ej: Mercado Central"
          validation="required|length:3"
          v-model="form.name"
        />

        <FormKit
          type="select"
          name="supplierType"
          :options="[
            { label: 'Mayorista', value: 'mayorista' },
            { label: 'Productor local', value: 'productor' },
            { label: 'Mercado', value: 'mercado' }
          ]"
          label-class="font-medium"
          messages-class="text-red-500 text-[0.75rem]"
          input-class="w-full"
          outer-class="w-full"
          placeholder="Seleccione un tipo de proveedor"
          label="Tipo de proveedor"
          v-model="form.supplierType"
        />

        <FormKit
          type="text"
          name="location"
          input-class="w-full"
          label-class="font-medium"
          messages-class="text-red-500 text-[0.75rem]"
          label="Ubicación"
          placeholder="Ej: Buenos Aires, Zona Sur"
          v-model="form.location"
        />

        <!-- Specialties -->
        <div class="flex flex-col gap-2">
          <label class="font-medium">Especialidades</label>
          <div class="flex flex-wrap gap-2 border rounded-md p-2 min-h-[80px]">
            <div
              v-for="(specialty, index) in form.specialties"
              :key="index"
              class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center h-fit"
            >
              <span>{{ specialty }}</span>
              <button type="button" @click="removeSpecialty(index)" class="ml-1 text-blue-600 hover:text-blue-800">
                &times;
              </button>
            </div>
            <div class="flex w-full mt-2 h-fit" v-if="showAddSpecialty">
              <input
                type="text"
                v-model="newSpecialty"
                class="border rounded-l-md px-3 py-2 flex-1"
                placeholder="Ej: Cítricos, Hortalizas, etc."
                @keyup.enter="addSpecialty"
                @keydown.enter.prevent
              />
              <button
                type="button"
                @click="addSpecialty"
                class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-r-md"
              >
                Agregar
              </button>
            </div>
            <button
              v-else
              type="button"
              @click="showAddSpecialty = true"
              class="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1 rounded-md flex items-center h-fit ring-1 ring-gray-300"
            >
              <span class="mr-1">+</span> Agregar especialidad
            </button>
          </div>
        </div>

        <!-- Notes (optional for future expansion) -->
        <FormKit
          type="textarea"
          name="notes"
          label-class="font-medium"
          messages-class="text-red-500 text-[0.75rem]"
          input-class="w-full"
          label="Notas adicionales (opcional)"
          placeholder="Información adicional sobre este proveedor"
          rows="3"
          v-model="form.notes"
        />
      </FormKit>

      <!-- Success message when a new supplier is created -->
      <div v-if="submitted && isNewSupplier" class="w-full flex flex-col gap-[2rem] flex-1 min-h-full justify-center">
        <div class="flex flex-col items-center gap-[1rem]">
          <IconParkOutlineCheckOne class="text-[3rem] text-success" />
          <span class="text-[2rem] font-semibold">¡Proveedor Creado!</span>
        </div>
        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-3">
            <button @click="resetForm" class="btn bg-primary text-white">Agregar Otro Proveedor</button>
            <button @click="closeModal" class="btn bg-secondary w-full text-center ring-1 ring-gray-300">
              Volver al Listado
            </button>
          </div>
        </div>
      </div>
    </template>
    <template #footer>
      <div v-if="submitting" class="btn bg-secondary border text-center">Cargando...</div>
      <FormKit
        v-else-if="!submitted"
        type="submit"
        form="supplier-form"
        :label="isNewSupplier ? 'Agregar' : 'Actualizar'"
        :input-class="
          isNewSupplier
            ? 'btn bg-primary text-white text-center w-full'
            : 'btn bg-secondary border text-center hover:bg-gray-200 hover:ring-2 hover:ring-gray-500 w-full'
        "
      />

      <div v-if="submitting" class="btn bg-danger text-white text-nowrap">Cargando...</div>
      <button
        v-if="!isNewSupplier && !submitted"
        @click="confirmDeleteSupplier()"
        class="flex items-center justify-center gap-2 btn bg-danger text-white text-nowrap hover:ring-2 hover:ring-red-500"
      >
        <TablerTrash /> Eliminar
      </button>
    </template>
  </ModalStructure>
  <ConfirmDialogue ref="confirmDialogue" />
</template>

<script setup>
import TablerTrash from "~icons/tabler/trash";
import IconParkOutlineCheckOne from "~icons/icon-park-outline/check-one";

// ----- Define Pinia Vars -----
const suppliersStore = useSuppliersStore();

// ----- Define Vars -----
const submitting = ref(false);
const submitted = ref(false);
const isNewSupplier = ref(true);
const currentSupplier = ref({});
const showAddSpecialty = ref(false);
const newSpecialty = ref("");

const form = ref({
  name: "",
  supplierType: null,
  location: "",
  specialties: [],
  notes: ""
});

// ----- Define Refs -----
const mainModal = ref(null);
const confirmDialogue = ref(null);

// ----- Define Methods -----
function resetForm() {
  submitted.value = false;
  form.value = {
    name: "",
    supplierType: null,
    location: "",
    specialties: [],
    notes: ""
  };
  showAddSpecialty.value = false;
  newSpecialty.value = "";
}

function closeModal() {
  mainModal.value.closeModal();
}

async function handleSubmit() {
  if (submitting.value) return;

  submitting.value = true;

  try {
    if (isNewSupplier.value) {
      await addSupplier();
    } else {
      await updateSupplier();
    }
  } finally {
    submitting.value = false;
  }
}

async function addSupplier() {
  const result = await suppliersStore.addSupplier({
    name: form.value.name,
    supplierType: form.value.supplierType,
    location: form.value.location,
    specialties: form.value.specialties,
    notes: form.value.notes
  });

  if (result) {
    submitted.value = true;
  }
}

async function updateSupplier() {
  if (!currentSupplier.value || !currentSupplier.value.id) {
    useToast("error", "Error al actualizar proveedor: ID no válido");
    return;
  }

  const confirmed = await confirmDialogue.value.openDialog({
    edit: true,
    title: "Confirmar cambios",
    message: "¿Estás seguro de que deseas actualizar este proveedor?"
  });

  if (!confirmed) return;

  const success = await suppliersStore.updateSupplier({
    id: currentSupplier.value.id,
    name: form.value.name,
    supplierType: form.value.supplierType,
    location: form.value.location,
    specialties: form.value.specialties,
    notes: form.value.notes,
    businessId: currentSupplier.value.businessId,
    userUid: currentSupplier.value.userUid,
    createdAt: currentSupplier.value.createdAt
  });

  if (success) {
    closeModal();
  }
}

async function confirmDeleteSupplier() {
  if (!currentSupplier.value || !currentSupplier.value.id) return;

  const confirmed = await confirmDialogue.value.openDialog({
    title: "Eliminar proveedor",
    message: "¿Estás seguro de que deseas eliminar este proveedor? Esta acción no se puede deshacer."
  });

  if (!confirmed) return;

  submitting.value = true;
  const success = await suppliersStore.archiveSupplier(currentSupplier.value.id);
  submitting.value = false;

  if (success) {
    closeModal();
  }
}

function addSpecialty() {
  if (newSpecialty.value.trim() === "") return;

  // Avoid duplicates
  if (!form.value.specialties.includes(newSpecialty.value.trim())) {
    form.value.specialties.push(newSpecialty.value.trim());
  }

  newSpecialty.value = "";
}

function removeSpecialty(index) {
  form.value.specialties.splice(index, 1);
}

const showModal = (supplier = null) => {
  resetForm();
  submitted.value = false;

  // Determine if we're adding or editing
  isNewSupplier.value = !supplier;

  if (supplier) {
    currentSupplier.value = { ...supplier };
    form.value = {
      name: supplier.name || "",
      supplierType: supplier.supplierType || null,
      location: supplier.location || "",
      specialties: supplier.specialties || [],
      notes: supplier.notes || ""
    };
  }

  // Show modal
  mainModal.value.showModal();
};

// ----- Define Expose -----
defineExpose({ showModal });
</script>
