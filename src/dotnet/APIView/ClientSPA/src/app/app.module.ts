import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavBarComponent } from './_components/shared/nav-bar/nav-bar.component';
import { IndexPageComponent } from './_components/index-page/index-page.component';
import { ReviewsListComponent } from './_components/reviews-list/reviews-list.component';
import { FooterComponent } from './_components/shared/footer/footer.component';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule } from 'primeng/paginator';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { TreeSelectModule } from 'primeng/treeselect';
import { SidebarModule } from 'primeng/sidebar';
import { TimeagoModule } from "ngx-timeago";
import { ChipModule } from 'primeng/chip';
import { BadgeModule } from 'primeng/badge';
import { ImageModule } from 'primeng/image';
import { LanguageNamesPipe } from './_pipes/language-names.pipe';
import { AvatarModule } from 'primeng/avatar';
import { ContextMenuModule } from 'primeng/contextmenu';
import { FileUploadModule } from 'primeng/fileupload';
import { TooltipModule } from 'primeng/tooltip';




@NgModule({
  declarations: [
    AppComponent,
    IndexPageComponent,
    LanguageNamesPipe,
    NavBarComponent,
    ReviewsListComponent,
    FooterComponent
  ],
  imports: [
    AppRoutingModule,
    AvatarModule,
    BadgeModule,
    BrowserModule,
    BrowserAnimationsModule,
    ButtonModule,
    ChipModule,
    ContextMenuModule,
    DropdownModule,
    FileUploadModule,
    HttpClientModule,
    ImageModule,
    InputTextModule,
    MenubarModule,
    MultiSelectModule,
    PaginatorModule,
    SidebarModule,
    TableModule,
    TimeagoModule.forRoot(),
    TooltipModule,
    TreeSelectModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
