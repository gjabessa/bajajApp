import { Component, OnInit, Input } from '@angular/core';

import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { AngularFireStorage } from '@angular/fire/storage';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
})
export class DetailsComponent implements OnInit {
  items: any;
  user: Observable<any[]>
  userRef: AngularFireList<any>
  total = 0;
  @Input() user_id: string;
  @Input() store_id: string;
  @Input() store_name: string;
  constructor(public db: AngularFireDatabase, public storage: AngularFireStorage,public modalController: ModalController) {
    

   }

   ngAfterViewInit(){
    this.userRef = this.db.list("/userdata/"+this.user_id+"/cart", ref => ref.orderByChild('store_id').equalTo(this.store_id))
    
      this.user = this.userRef.snapshotChanges().pipe(
        map(changes =>  changes.map(c => ({ key: c.payload.key, ...c.payload.val() })))
      )
      this.user.subscribe(value => console.log(value))
      this.userRef.valueChanges().subscribe(
        result => {
          this.total = 0;
          for(let item of result){
            this.total += parseInt(item.price);
          }
        } 
      )
   }
   
   dismiss() {
    // using the injected ModalController this page
    // can "dismiss" itself and optionally pass back data
    this.modalController.dismiss({
      'dismissed': true
    });
  }
  ngOnInit() {}

}
