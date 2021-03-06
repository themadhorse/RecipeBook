import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Recipe } from '../recipe.model';
import { RecipeService } from '../recipe.service';
import * as fromApp from '../../store/app.reducer';
import * as RecipeActions from '../store/recipe.actions';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-recipe-edit',
  templateUrl: './recipe-edit.component.html',
  styleUrls: ['./recipe-edit.component.css']
})
export class RecipeEditComponent implements OnInit, OnDestroy {
  id: number;
  editMode = false;
  recipeForm: FormGroup;
  subscription: Subscription;

  constructor(private route: ActivatedRoute, private recipeService: RecipeService, private router: Router, private store: Store<fromApp.AppState>) { }

  ngOnInit(): void {
    this.route.params.pipe(
      map((params: Params) => {
        this.id = +params['id'];
        this.editMode = params['id'] != null;
        }
      ),
      switchMap(() => this.store.select('recipes')),
      map(recipeState => [...recipeState.globalRecipes, ...recipeState.recipes]),
      map((recipes: Recipe[]) => recipes[this.id])
      ).subscribe((recipe: Recipe) => {
        this.initForm(recipe);
      })
  }

  private initForm(selectedRecipe: Recipe) {
    let recipeName = "";
    let recipeImgPath = "";
    let recipeDescription = "";
    let isRecipeGlobal = false;
    let recipeIngredients = new FormArray([]);

    if (this.editMode) {
          const recipe = selectedRecipe;
          recipeName = recipe.name;
          isRecipeGlobal = recipe.isGlobal;
          recipeImgPath = recipe.imgPath;
          if (recipe['ingredients']) {
            for (let ingredient of recipe['ingredients']) {
              recipeIngredients.push(
                new FormGroup({
                  'name': new FormControl(ingredient.name, Validators.required),
                  'amount': new FormControl(ingredient.amount, [Validators.required, Validators.pattern(/^[1-9]+[0-9]*$/)])
                })
              );
            }
          }
          recipeDescription = recipe.description;
    }

    this.recipeForm = new FormGroup({
      'name': new FormControl(recipeName, Validators.required),
      'description': new FormControl(recipeDescription, Validators.required),
      'imgPath': new FormControl(recipeImgPath, Validators.required),
      'isGlobal': new FormControl(isRecipeGlobal, Validators.required),
      'ingredients': recipeIngredients
    });
  }

  onSubmit() {

    //this.recipeService.addRecipe(new Recipe(this.recipeForm.get('name').value, this.recipeForm.get('description').value, this.recipeForm.get('imgPath').value, this.recipeForm.get('ingredients').value), this.id, this.editMode);
    if(this.editMode)
    {
      const recipeToBeUpdated = new Recipe(this.recipeForm.get('name').value, this.recipeForm.get('description').value, this.recipeForm.get('imgPath').value, this.recipeForm.get('ingredients').value, this.recipeForm.get('isGlobal').value);

      if(this.recipeForm.get('isGlobal').value)
        this.store.dispatch(new RecipeActions.UpdateGlobalRecipe({index: this.id, newRecipe: recipeToBeUpdated}))
      else
      this.store.dispatch(new RecipeActions.UpdateRecipe({index: this.id, newRecipe: recipeToBeUpdated}))
    }
    else
    {
      const recipeToBeAdded = new Recipe(this.recipeForm.get('name').value, this.recipeForm.get('description').value, this.recipeForm.get('imgPath').value, this.recipeForm.get('ingredients').value, this.recipeForm.get('isGlobal').value);

      if(this.recipeForm.get('isGlobal').value)
        this.store.dispatch(new RecipeActions.AddGlobalRecipe(recipeToBeAdded));
      else
        this.store.dispatch(new RecipeActions.AddRecipe(recipeToBeAdded));
    }
    this.onCancel();
  }

  get controls() {
    return (<FormArray>this.recipeForm.get('ingredients')).controls;
  }

  onAddIngredient() {
    (<FormArray>this.recipeForm.get('ingredients')).push(
      new FormGroup({
        'name': new FormControl(null, Validators.required),
        'amount': new FormControl(null, [Validators.required, Validators.pattern(/^[1-9]+[0-9]*$/)])
      })
    );
  }

  onCancel() {
    if (this.editMode)
      this.router.navigate(['/recipes', this.id]);
    else
      this.router.navigate(['/recipes']);
  }

  delIngredient(index: number) {
    (<FormArray>this.recipeForm.get('ingredients')).removeAt(index);
  }

  ngOnDestroy(){
    if(this.subscription)
      this.subscription.unsubscribe();
  }
}
