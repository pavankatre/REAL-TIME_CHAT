import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chatbubblesOutline, personOutline } from 'ionicons/icons';

@Component({
    selector: 'app-tabs',
    template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="chat-list">
          <ion-icon name="chatbubbles-outline"></ion-icon>
          <ion-label>Chats</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile">
          <ion-icon name="person-outline"></ion-icon>
          <ion-label>Profile</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
    standalone: true,
    imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel]
})
export class TabsPage {
    constructor() {
        addIcons({ chatbubblesOutline, personOutline });
    }
}
