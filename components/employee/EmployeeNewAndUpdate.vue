<template>
  <ModalStructure ref="mainModal">
    <template #header>
      <div v-if="currentEmployee" class="flex flex-col gap-2 w-full">
        <div class="flex flex-col cursor-pointer w-full">
          <span class="font-semibold text-xl">Editar empleado: {{ currentEmployee.employeeName }}</span>
        </div>
        <div class="flex flex-col cursor-pointer w-full">
          <span class="text-xs text-gray-500">Empleado id: {{ currentEmployee.id }}</span>
        </div>
      </div>
      <div v-else class="flex flex-col gap-2 w-full">
        <span class="font-semibold text-xl">Nuevo empleado</span>
        <span class="text-gray-500">Registra un nuevo empleado</span>
      </div>
    </template>
    <template #default>
      <FormKit
        type="form"
        id="business-create-modify"
        :form-class="`flex flex-col gap-4 w-full ${submitted ? 'hidden' : ''}`"
        submit-label="Nuevo Producto"
        @submit="updateOrCreateEmployee"
        :actions="false"
      >
        <FormKit
          type="text"
          name="nombre"
          label-class="font-medium"
          messages-class="text-red-500 text-[0.75rem]"
          input-class="w-full"
          label="Nombre del empleado*"
          placeholder="Ej: Carlos Pérez"
          validation="required"
          v-model="form.employeeName"
        />

        <FormKit
          type="select"
          name="role"
          :options="['Propietario', 'Empleado']"
          label-class="font-medium"
          messages-class="text-red-500 text-[0.75rem]"
          input-class="w-full"
          outer-class="w-full flex-1"
          label="Rol del empleado*"
          placeholder="Ej: Propietario"
          validation="required"
          v-model="form.role"
        />
        <div class="flex flex-col gap-1">
          <span class="font-medium">Teléfono (opcional)</span>
          <input
            @input="() => (form.phone = formatPhoneNumber(form.phone))"
            maxlength="20"
            v-model="form.phone"
            type="text"
            placeholder="Numero de telefono"
          />
        </div>
        <div class="flex flex-col gap-1" v-if="currentEmployee">
          <span class="font-medium">Estado</span>
          <div class="flex items-center gap-2">
            <span
              class="font-semibold"
              :class="{
                ['text-warning']: currentEmployee?.status?.includes('Pendiente'),
                ['text-danger']: currentEmployee?.status?.includes('Archivado'),
                ['text-success']: currentEmployee?.status?.includes('Activo')
              }"
              >{{ currentEmployee?.status }}</span
            >
          </div>
        </div>
      </FormKit>
    </template>
    <template #footer>
      <div v-if="submitting" class="btn bg-secondary border text-center">loading...</div>
      <FormKit
        v-else-if="!currentEmployee?.status?.includes('Archivado')"
        type="submit"
        form="business-create-modify"
        label="Guardar cambios"
        input-class="btn bg-secondary border text-center hover:bg-gray-200 hover:ring-2 hover:ring-gray-500 w-full"
      />

      <div v-if="submitting && currentEmployee" class="btn bg-danger text-white text-nowrap">loading...</div>
      <button
        v-else-if="currentEmployee && !currentEmployee?.status?.includes('Archivado')"
        @click="archiveEmployee()"
        class="flex items-center justify-center gap-2 btn bg-secondary text-nowrap ring-1 ring-danger hover:bg-danger hover:text-white"
      >
        <IcOutlineArchive /> Archivar
      </button>
    </template>
  </ModalStructure>
  <Loader v-if="submitting" />
  <ConfirmDialogue ref="confirmDialogue" />
</template>

<script setup>
import { ToastEvents } from "~/interfaces";
import TablerTrash from "~icons/tabler/trash";
import IcOutlineArchive from "~icons/ic/outline-archive";

// ----- Define Pinia Vars -----
const indexStore = useIndexStore();
const { getEmployees: employees, getCurrentBusiness: currentBusiness } = storeToRefs(indexStore);

// ----- Define Vars -----
const submitting = ref(false);
const newEmployee = ref(false);
const currentEmployee = ref(null);
const form = ref({
  employeeName: "",
  phone: "",
  role: ""
});

// Refs
const mainModal = ref(null);
const confirmDialogue = ref(null);

// ----- Define Methods -----
async function updateOrCreateEmployee() {
  // If submitting, return
  if (submitting.value) return;
  submitting.value = true;

  let informationSaved = false;
  if (newEmployee.value) {
    // When saving the employee it will be like a new business, so name and imageUrl will be the same as the business
    // The validation is managed by the store

    informationSaved = await indexStore.saveEmployee({
      ...form.value,
      businessId: currentBusiness.value.id,
      name: currentBusiness.value.name,
      imageUrl: currentBusiness.value.imageUrl
    });
  } else {
    // The validation is managed by the store
    informationSaved = await indexStore.updateEmployee(
      {
        ...form.value
      },
      currentEmployee.value // Full current employee info to validate
    );
  }

  if (informationSaved) {
    useToast(ToastEvents.success, `Negocio ${newEmployee.value ? "creado" : "actualizado"} correctamente`);
    mainModal.value.closeModal();

    // Clean the form
    form.value = {
      name: "",
      description: "",
      phone: "",
      role: ""
    };
  } // False will be handled by the store

  submitting.value = false;
}

async function archiveEmployee() {
  if (submitting.value) return;
  submitting.value = true;

  const archived = await indexStore.archiveEmployee(currentEmployee.value.id);

  if (archived) {
    useToast(ToastEvents.success, "Empleado archivado correctamente");
    mainModal.value.closeModal();
  } // False will be handled by the store

  submitting.value = false;
}

const showModal = (employeeId = false) => {
  // Clear form
  form.value = {
    name: "",
    description: "",
    phone: "",
    role: ""
  };
  currentEmployee.value = null;

  if (employeeId) {
    // Set the current employee
    currentEmployee.value = employees.value.find((employee) => employee.id === employeeId);

    // Check if the business exists
    if (!currentEmployee.value) {
      useToast(ToastEvents.error, "El negocio que intentas editar no existe");
      return;
    }

    // Update form values
    form.value.employeeName = currentEmployee.value.employeeName;
    form.value.role = currentEmployee.value.role;
    form.value.phone = currentEmployee.value.phone || "";

    newEmployee.value = false;
    mainModal.value.showModal();
    return;
  }

  // Show modal
  mainModal.value.showModal();
  newEmployee.value = true;
};

// ----- Define Hooks -----

// ----- Define Expose -----
defineExpose({ showModal });
</script>
