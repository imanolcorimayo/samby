import { defineStore } from "pinia";
import { collection, addDoc, query, where, getDocs, serverTimestamp, limit } from "firebase/firestore";
import { watch } from "vue";

type TestingGroup = "A" | "B" | "C";

interface ABTestingState {
  testingGroup: TestingGroup | null;
  isInitialized: boolean;
}

export const useABTestingStore = defineStore("abTesting", {
  state: (): ABTestingState => ({
    testingGroup: null,
    isInitialized: false
  }),

  actions: {
    // Assigns a random testing group
    assignRandomGroup(): TestingGroup {
      const groups: TestingGroup[] = ["A", "B", "C"];
      return groups[Math.floor(Math.random() * groups.length)];
    },

    // Save testing group to cookies
    saveGroupToCookies(group: TestingGroup) {
      const cookies = useCookie("samby_testing_group", {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: "/"
      });
      cookies.value = group;
    },

    // Get testing group from cookies
    getGroupFromCookies(): TestingGroup | null {
      const cookies = useCookie("samby_testing_group");
      return cookies.value as TestingGroup | null;
    },

    // Save testing group to Firestore
    async saveGroupToFirestore(userId: string, group: TestingGroup) {
      const db = useFirestore();

      try {
        // Check if user already has a testing group assigned
        const userGroupsRef = collection(db, "userTestingGroups");
        const userGroupQuery = query(userGroupsRef, where("userUid", "==", userId), limit(1));

        const snapshot = await getDocs(userGroupQuery);

        // If user doesn't have a group, assign and save one
        if (snapshot.empty) {
          await addDoc(userGroupsRef, {
            userUid: userId,
            testingGroup: group,
            createdAt: serverTimestamp()
          });
          return true;
        }

        return false;
      } catch (error) {
        console.error("Error saving testing group:", error);
        return false;
      }
    },

    // Get user's testing group (from cookies or assign new)
    async initializeTestingGroup() {
      if (this.isInitialized) return this.testingGroup;

      // First try to get from cookies
      let group = this.getGroupFromCookies();

      if (!group) {
        // If not found, assign a new random group
        group = this.assignRandomGroup();
        this.saveGroupToCookies(group);
      }

      this.testingGroup = group;
      this.isInitialized = true;

      // Set up a watcher for user authentication state
      this.setupUserWatcher();

      return group;
    },

    // Set up a watcher to save the testing group when a user logs in
    setupUserWatcher() {
      const user = useCurrentUser();

      // Watch for changes in user authentication state
      watch(
        user,
        async (newUser) => {
          if (newUser && this.testingGroup) {
            // User logged in and we have a testing group, save to Firestore
            await this.saveGroupToFirestore(newUser.uid, this.testingGroup);
          }
        },
        { immediate: true }
      );
    }
  }
});
