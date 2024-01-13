import { AfterViewInit, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MenuItem, SortEvent } from 'primeng/api';
import { Table, TableFilterEvent, TableLazyLoadEvent } from 'primeng/table';
import { Pagination } from 'src/app/_models/pagination';
import { Review } from 'src/app/_models/review';
import { Revision } from 'src/app/_models/revision';
import { RevisionsService } from 'src/app/_services/revisions/revisions.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-revisions-list',
  templateUrl: './revisions-list.component.html',
  styleUrls: ['./revisions-list.component.scss']
})
export class RevisionsListComponent implements OnInit, OnChanges {
  @Input() review : Review | null = null;
  reviewPageWebAppUrl : string = environment.webAppUrl + "Assemblies/review/";
  profilePageWebAppUrl : string = environment.webAppUrl + "Assemblies/profile/";
  revisions : Revision[] = [];
  totalNumberOfRevisions = 0;
  pagination: Pagination | undefined;
  insertIndex : number = 0;
  rowHeight: number = 48;
  noOfRows: number = Math.floor((window.innerHeight * 0.75) / this.rowHeight); // Dynamically Computing the number of rows to show at once
  pageSize = 20; // No of items to load from server at a time
  sortField : string = "lastUpdatedOn";
  sortOrder : number = 1;
  filters: any = null;

  // Filters
  details: any[] = [];
  selectedDetails: any[] = [];
  showDeletedAPIRevisions : boolean = false;
  sidebarVisible : boolean = false;

  // Context Menu
  contextMenuItems! : MenuItem[];
  selectedRevision!: Revision;
  selectedRevisions!: Revision[];
  showSelectionActions : boolean = false;
  showDiffButton : boolean = false;

  // Messages
  apiRevisionsListDetail: string = "APIRevisions in"

  badgeClass : Map<string, string> = new Map<string, string>();

  constructor(private revisionsService: RevisionsService) { }

  ngOnInit(): void {
    this.createFilters();
    this.createContextMenuItems();
    this.setDetailsIcons();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['review'].previousValue != changes['review'].currentValue){
      this.loadRevisions(0, this.pageSize * 2, true);
      this.showSelectionActions = false;
      this.showDiffButton = false;
    }
  }

  /**
   * Load revision from API
   *  * @param append wheather to add to or replace existing list
   */
  loadRevisions(noOfItemsRead : number, pageSize: number, resetReviews = false, filters: any = null, sortField: string ="lastUpdatedOn",  sortOrder: number = 1) {
    console.log("Review Id %o", this.review?.id);
    let label : string = "";
    let author : string = "";
    let reviewId: string = this.review?.id ?? "";
    let details : string [] = [];
    if (filters)
    {
      label = filters.label.value ?? label;
      author = filters.author.value ?? author;
      details = (filters.details.value != null) ? filters.details.value.map((item: any) => item.data): details;
    }

    this.revisionsService.getAPIRevisions(noOfItemsRead, pageSize, reviewId, label, author, details, sortField, sortOrder, this.showDeletedAPIRevisions).subscribe({
      next: (response: any) => {
        if (response.result && response.pagination) {
          if (resetReviews)
          {
            const arraySize = Math.ceil(response.pagination!.totalCount + Math.min(20, (0.05 * response.pagination!.totalCount))) // Add 5% extra rows to avoid flikering
            this.revisions = Array.from({ length: arraySize });
            this.insertIndex = 0;
            this.showSelectionActions = false;
            this.showDiffButton = false;
          }

          if (response.result.length > 0)
          {
            this.revisions.splice(this.insertIndex, this.insertIndex + response.result.length, ...response.result);
            this.insertIndex = this.insertIndex + response.result.length;
            this.pagination = response.pagination;
            this.totalNumberOfRevisions = this.pagination?.totalCount!;
          }
        }
      }
    });
  }

  createContextMenuItems() {
    if (this.showDeletedAPIRevisions)
    {
      this.contextMenuItems = [
        { label: 'Restore', icon: 'pi pi-folder-open', command: () => this.viewRevision(this.selectedRevision) }
      ];
    }
    else 
    {
      this.contextMenuItems = [
        { label: 'View', icon: 'pi pi-folder-open', command: () => this.viewRevision(this.selectedRevision) },
        { label: 'Delete', icon: 'pi pi-fw pi-times', command: () => this.deleteRevision(this.selectedRevision) }
      ];
    }
  }

  createFilters() {     
    this.details = [
      {
        label: 'Status',
        data: 'All',
        items: [
          { label: "Approved", data: "Approved" },
          { label: "Pending", data: "Pending" },
        ]
      },
      {
        label: 'Type',
        data: 'All',
        items: [
          { label: "Automatic", data: "Automatic" },
          { label: "Manual", data: "Manual" },
          { label: "Pull Request", data: "PullRequest" }
        ]
      }
    ];
  }

  setDetailsIcons(){
    // Set Badge Class for details Icons
    this.badgeClass.set("false", "fa-solid fa-circle-minus text-warning");
    this.badgeClass.set("true", "fas fa-check-circle text-success");
    this.badgeClass.set("Manual", "fa-solid fa-arrow-up-from-bracket");
    this.badgeClass.set("PullRequest", "fa-solid fa-code-pull-request");
    this.badgeClass.set("Automatic", "fa-solid fa-robot");
  }

  viewDiffOfSelectedAPIRevisions() {
    if (this.selectedRevisions.length == 2)
    {
      this.revisionsService.openDiffOfAPIRevisions(this.review!.id, this.selectedRevisions[0].id, this.selectedRevisions[1].id)
    }
  }
  
  viewRevision(revision: Revision) {
    if (!this.showDeletedAPIRevisions)
    {
      this.revisionsService.openAPIRevisionPage(this.review!.id, revision.id);
    }
  }

  deleteRevisions(revisions: Revision []) {
    this.revisionsService.deleteAPIRevisions(this.review!.id, revisions.map(r => r.id)).subscribe({
      next: (response: any) => {
        if (response) {
          this.loadRevisions(0, this.pageSize * 2, true);
          this.selectedRevisions = [];
          this.showSelectionActions = false;
          this.showDiffButton = false;
        }
      }
    });
  }

  restoreRevisions(revisions: Revision []) {
    this.revisionsService.restoreAPIRevisions(this.review!.id, revisions.map(r => r.id)).subscribe({
      next: (response: any) => {
        if (response) {
          this.loadRevisions(0, this.pageSize * 2, true);
          this.selectedRevisions = [];
          this.showSelectionActions = false;
          this.showDiffButton = false;
        }
      }
    });
  }

  deleteRevision(revision: Revision) {
    this.revisionsService.deleteAPIRevisions(revision.reviewId, [revision.id]).subscribe({
      next: (response: any) => {
        if (response) {
          this.loadRevisions(0, this.pageSize * 2, true);
          this.showSelectionActions = false;
          this.showDiffButton = false;
        }
      }
    });
  }

  /**
  * Return true if table has filters applied.
  */
  tableHasFilters() : boolean {
    return (this.sortField != "lastUpdatedOn" || this.sortOrder != 1 || (this.filters && (this.filters.label.value != null || this.filters.author.value != null || this.filters.details.value != null)));
  }

  /**
  * Clear all filters in Table
  */
  clear(table: Table) {
    table.clear();
    this.loadRevisions(0, this.pageSize * 2, true);
  }

  /**
  * Toggle Show deleted APIRevisions
  */
  toggleShowDeletedAPIRevisions() {
    this.showDeletedAPIRevisions = !this.showDeletedAPIRevisions;
    this.loadRevisions(0, this.pageSize * 2, true);
    this.createContextMenuItems();
    if (!this.showDeletedAPIRevisions)
    {
      this.apiRevisionsListDetail = "APIRevisions";
    }
    else
    {
      this.apiRevisionsListDetail = "Deleted APIRevisions in";
    }
  }

  /**
   * Callback to invoke on scroll /lazy load.
   * @param event the lazyload event
   */
  onLazyLoad(event: TableLazyLoadEvent) {
      console.log("On Lazy Event Emitted %o", event);
      const last = Math.min(event.last!, this.totalNumberOfRevisions);
      this.sortField = event.sortField as string ?? "lastUpdatedOn";
      this.sortOrder = event.sortOrder as number ?? 1;
      this.filters = event.filters;
      if (last! > (this.insertIndex - this.pageSize))
      {
        if (this.pagination && this.pagination?.noOfItemsRead! < this.pagination?.totalCount!)
        {
          this.loadRevisions(this.pagination!.noOfItemsRead, this.pageSize, false, event.filters, this.sortField, this.sortOrder);
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
    this.loadRevisions(0, this.pageSize, true, event.filters);
  }

  /**
   * Callback to invoke on table selection.
   * @param event the Filter event
   */
  onSelectionChange(value = []) {
    console.log("On Selection Event Emitted %o", value);
    this.selectedRevisions = value;
    this.showSelectionActions = (value.length > 0) ? true : false;
    this.showDiffButton = (value.length == 2) ? true : false;
  }

  /**
   * Callback to invoke on column sort.
   * @param event the Filter event
   */
  onSort(event: SortEvent) {
      console.log("Sort Event Emitted %o", event);
      this.loadRevisions(0, this.pageSize, true, null, event.field, event.order);
    }
}
