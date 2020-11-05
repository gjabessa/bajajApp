import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularFireDatabase, AngularFireList } from '@angular/fire/database';
import { AngularFireStorage } from '@angular/fire/storage';
import { map } from 'rxjs/operators';
import { ModalController } from '@ionic/angular';
import { DetailsComponent } from '../details/details.component';
@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
})
export class FolderPage implements OnInit {
  public folder: string;
  orderRef: AngularFireList<any>
  completedOrders: AngularFireList<any>
  activeOrderRef: AngularFireList<any>
  activeOrder
  userRef;
  username;
  status;
  driver;
  user_id = 'custom_id';
  order_id;
  order;
  order_user_id: string;
  price = '100 Birr';
  stores;
  order_user_wallet: Number;
  wallet: Number;
  constructor(private activatedRoute: ActivatedRoute, public db: AngularFireDatabase,public modalController: ModalController) { 
    this.orderRef = db.list("/orders", ref => ref);
    this.order = this.orderRef.snapshotChanges().pipe(
      map(changes =>  changes.map(c => ({ key: c.payload.key, ...c.payload.val() })))
    )

    this.completedOrders = db.list("/completedOrders", ref => ref)
    this.order?.subscribe(value =>{
      this.order_id = value[0]?.key; 
    this.activeOrder = db.object("/orders/"+this.order_id+"/");
    
    this.activeOrder.valueChanges().subscribe( res => {
      if(res){
        var result:any = res;
        this.order_user_id = result.user_id;
        const storesRef = this.db.list("/userdata/"+this.order_user_id+"/stores/")
        const storeRef = storesRef.valueChanges().subscribe(
          store =>{ 
            this.stores = store;
          }
        )
        this.userRef = db.object("/userdata/"+this.order_user_id);
        this.userRef.valueChanges().subscribe(user => {
          this.status = result.status;
          this.driver = result.driver;
          this.order_user_wallet = result.wallet;
          if(this.status != 'Cancelled' || (this.driver == undefined || this.driver == this.user_id)){
            var u:any = user;
            this.username = u.name;
          }
        })
        
        // alert("there is ")
      }
    })
  })
  }
  async presentModal(store_id,store_name) {
    console.log(this.order_user_id)
    const modal = await this.modalController.create({
      component: DetailsComponent,
      cssClass: 'my-custom-class',
      componentProps: {
        'user_id': this.order_user_id,
        'store_id': store_id,
        'store_name':store_name
      }
    });
    return await modal.present();
  }
  
  clear(){
    this.username = '';
    this.status = '';
  }
  accept(i){
    this.status = 'Accepted';
    this.driver = this.user_id;
    this.activeOrder.update({status:this.status, driver: this.driver})
  }
  start(){
    this.status = 'Started';
    this.activeOrder.update({status:this.status})
  }
  complete(){
    this.status = 'Completed';
    this.activeOrder.update({status:this.status, driver: this.driver})
    for(let store of this.stores){
      var cartRef = this.db.list("/userdata/"+this.order_user_id);
      var storeObj: any = store;
      console.log(storeObj)
      var storeRef = this.db.object("/userdata/"+storeObj.store_id);
      var storeRefsub = storeRef.valueChanges().subscribe(result => {
        var storeVal:any = result;
        var wallet = storeVal?.wallet;
        storeRefsub.unsubscribe();
        if(wallet == undefined){
          wallet = 0;
        }
        var totalWallet = parseFloat(wallet)+parseFloat(storeObj.price)
        var walletRef = this.db.list("/wallet");
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = today.getFullYear();

        var day  = mm + '/' + dd + '/' + yyyy;
        walletRef.push({date:day,user_id:this.order_user_id, wallet:parseFloat(storeObj.price), driver_id:this.user_id, reason:'Item purchase'});
        storeRef.update({'wallet':totalWallet})
        
      })
    }
    // this.userRef.set('order_user_wallet',this.order_user_wallet)
    this.clear();
  }
  cancel(){
    this.status = 'Cancelled';
    this.driver = this.user_id;
    this.completedOrders.push({status:this.status,driver:this.driver,user_id:this.order_user_id, price: this.price});
    this.activeOrder.remove();
    this.clear()
  }
  done(){
    this.status = 'Done';
    this.completedOrders.push({status:this.status,driver:this.driver,user_id:this.order_user_id, price: this.price});
    this.activeOrder.remove();
    this.clear();
  }
  ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get('id');
  }

}
