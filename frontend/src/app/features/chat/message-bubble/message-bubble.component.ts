import { Component, DoCheck, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../../core/services/chat.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './message-bubble.component.html',
  styleUrl: './message-bubble.component.css'
})
export class MessageBubbleComponent {
  @Input({ required: true }) message!: Message;
  @Input() isMine: boolean = false;
  @Input() isGroup: boolean = false;

  // ngDoCheck(): void {
  //   console.log(this.message);
  // }

}
