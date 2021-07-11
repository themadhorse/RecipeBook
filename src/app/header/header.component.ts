import { Component, ComponentFactoryResolver, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { AlertComponent } from '../shared/alert/alert.component';
import { PlaceholderDirective } from '../shared/placeholder.directive';
import { AppState } from '../store/app.reducer';
import * as AuthActions from '../auth/store/auth.actions';
import * as RecipeActions from '../recipe-book/store/recipes.actions';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  collapsed = true;
  private userSub: Subscription;
  isAuthenticated = false;
  showConfirmBox = false;
  @ViewChild(PlaceholderDirective, { static: false }) confirmationHost: PlaceholderDirective;
  saveSub: Subscription;

  constructor(/*public dataStorage: DataStorageService, public authService: AuthService,*/ private componentFactoryResolver: ComponentFactoryResolver, private store: Store<AppState>) { }

  ngOnInit(): void {
    this.userSub = this.store.select('auth')
    .pipe(map(authState => authState.user))
    .subscribe(
      user => {
        this.isAuthenticated = !!user;
      }
    );
  }


  confirm(){
    this.showConfirmBox = true;
  }

  storeRecipes(){
    //this.dataStorage.storeRecipes();
    this.store.dispatch(new RecipeActions.StoreRecipes());
    this.showConfirmBox = false;
  }

  showConfirmation(){
      const confirmationCmpFactory = this.componentFactoryResolver.resolveComponentFactory(AlertComponent);
      const hostViewContainerRef = this.confirmationHost.veiwContainerRef;
      hostViewContainerRef.clear();

      const confirmationComponentRef = hostViewContainerRef.createComponent(confirmationCmpFactory);
      this.saveSub = confirmationComponentRef.instance.shouldSave.subscribe(
        (save: boolean) => {
          if(save){
            this.storeRecipes();
          }
          this.saveSub.unsubscribe();
          hostViewContainerRef.clear();
        }
      );

  }

  fetchRecipes(){
    //this.dataStorage.fetchRecipes().subscribe();
    this.store.dispatch(new RecipeActions.FetchRecipes());
  }

  logout(){
    //this.authService.logout();
    this.store.dispatch(new AuthActions.Logout());
  }

  ngOnDestroy(){
    this.userSub.unsubscribe();
    if(this.saveSub)
      this.saveSub.unsubscribe();
  }
}
