import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Review } from 'src/app/_models/review';
import { ReviewsService } from 'src/app/_services/reviews/reviews.service';
import { Pagination } from 'src/app/_models/pagination';
import { Table, TableFilterEvent, TableLazyLoadEvent, TablePageEvent, TableRowSelectEvent } from 'primeng/table';
import { MenuItem, SortEvent } from 'primeng/api';

@Component({
  selector: 'app-reviews-list',
  templateUrl: './reviews-list.component.html',
  styleUrls: ['./reviews-list.component.scss']
})

export class ReviewsListComponent implements OnInit {
  @Output() reviewEmitter : EventEmitter<Review> = new EventEmitter<Review>();

  reviews : Review[] = [];
  totalNumberOfReviews = 0;
  pagination: Pagination | undefined;
  insertIndex : number = 0;
  resetReviews = false;
  rowHeight: number = 43;
  noOfRows: number = Math.floor((window.innerHeight * 0.75) / this.rowHeight); // Dynamically Computing the number of rows to show at once
  pageSize = 20; // No of items to load from server at a time
  sortField : string = "lastUpdatedOn";
  sortOrder : number = 1;
  filters: any = null;

  sidebarVisible : boolean = false;

  // Filter Options
  languages: any[] = [];
  selectedLanguages: any[] = [];

  // Context Menu
  contextMenuItems! : MenuItem[];
  selectedReview!: Review;
  selectedReviews!: Review[];
  showSelectionAction : boolean = false;

  // Create Review Selections
  crLanguages: any[] = [];
  selectedCRLanguages: any[] = [];

  badgeClass : Map<string, string> = new Map<string, string>();


  constructor(private reviewsService: ReviewsService) { }

  ngOnInit(): void {
    this.loadReviews(0, this.pageSize * 2, true); // Initial load of 2 pages
    this.createFilters();
    this.createContextMenuItems();
  }

  /**
   * Load reviews from API
   *  * @param append wheather to add to or replace existing list
   */
  loadReviews(noOfItemsRead : number, pageSize: number, resetReviews = false, filters: any = null, sortField: string ="lastUpdatedOn",  sortOrder: number = 1) {
    // Reset Filter if necessary
    if (this.filters && this.filters.languages.value == null){
      this.selectedLanguages = [];
    }

    let packageName : string = "";
    let languages : string [] = [];
    if (filters)
    {
      packageName = filters.packageName.value ?? packageName;
      languages = (filters.languages.value != null)? filters.languages.value.map((item: any) => item.data) : languages;
    }

    this.reviewsService.getReviews(noOfItemsRead, pageSize, packageName, languages, sortField, sortOrder).subscribe({
      next: response => {
        if (response.result && response.pagination) {
          if (resetReviews)
          {
            const arraySize = Math.ceil(response.pagination!.totalCount + Math.min(20, (0.05 * response.pagination!.totalCount))) // Add 5% extra rows to avoid flikering
            this.reviews = Array.from({ length: arraySize  });
            this.insertIndex = 0;
          }

          if (response.result.length > 0)
          {
            this.reviews.splice(this.insertIndex, this.insertIndex + response.result.length, ...response.result);
            this.insertIndex = this.insertIndex + response.result.length;
            this.pagination = response.pagination;
            this.totalNumberOfReviews = this.pagination.totalCount;
          }
        }
      }
    });
  }

  createContextMenuItems() {
    this.contextMenuItems = [
      { label: 'View', icon: 'pi pi-folder-open', command: () => this.viewReview(this.selectedReview) },
    ];
  }

  createFilters() {
    this.languages = this.crLanguages = [
        { label: "C", data: "C" },
        { label: "C#", data: "C#" },
        { label: "C++", data: "C++" },
        { label: "Go", data: "Go" },
        { label: "Java", data: "Java" },
        { label: "JavaScript", data: "JavaScript" },
        { label: "Json", data: "Json" },
        { label: "Kotlin", data: "Kotlin" },
        { label: "Python", data: "Python" },
        { label: "Swagger", data: "Swagger" },
        { label: "Swift", data: "Swift" },
        { label: "TypeSpec", data: "TypeSpec" },
        { label: "Xml", data: "Xml" }
    ];
  }

  viewReview(product: Review) {
      
  }

  deleteReview(product: Review) {
      
  }

  /**
   * Return true if table has filters applied.
   */
  tableHasFilters() : boolean {
    return (this.filters && (this.filters.packageName.value != null || this.filters.languages.value != null));
  }

  /**
   * Clear all filters in Table
   */
  clear(table: Table) {
    table.clear();
    this.loadReviews(0, this.pageSize, true, this.filters, this.sortField, this.sortOrder);
  }

  /**
   * Callback to invoke on scroll /lazy load.
   * @param event the lazyload event
   */
  onLazyLoad(event: TableLazyLoadEvent) {
    console.log("On Lazy Event Emitted %o", event);
    const last = Math.min(event.last!, this.totalNumberOfReviews);
    this.sortField = event.sortField as string ?? "lastUpdatedOn";
    this.sortOrder = event.sortOrder as number ?? 1;
    this.filters = event.filters;
    if (last > (this.insertIndex - this.pageSize))
    {
      if (this.pagination && this.pagination?.noOfItemsRead! < this.pagination?.totalCount!)
      {
        this.loadReviews(this.pagination!.noOfItemsRead, this.pageSize, this.resetReviews, this.filters, this.sortField, this.sortOrder);
      }
    }
    event.forceUpdate!();
  }

  /**
   * Callback to invoke on table filter.
   * @param event the Filter event
   */
  onFilter(event: TableFilterEvent) {
    console.log("On Filter Event Emitted %o", event);
    this.filters = event.filters;
    this.loadReviews(0, this.pageSize, true, this.filters, this.sortField, this.sortOrder);
  }

  /**
   * Callback to invoke on row selection.
   * @param event the Filter event
   */
  onRowSelect(event: TableRowSelectEvent) {
    console.log("On Row Select Event Emitted %o", event);
    this.reviewEmitter.emit(event.data);
  }

  /**
   * Callback to invoke on column sort.
   * @param event the Filter event
   */
  onSort(event: SortEvent) {
    console.log("Sort Event Emitted %o", event);
    this.sortField = event.field as string ?? "packageName";
    this.sortOrder = event.order as number ?? 1;
    this.loadReviews(0, this.pageSize, true, this.filters, this.sortField, this.sortOrder);
  }
}
