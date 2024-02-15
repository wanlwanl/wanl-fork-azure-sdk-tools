import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MenuItem, SortEvent } from 'primeng/api';
import { Table, TableFilterEvent, TableLazyLoadEvent } from 'primeng/table';
import { Pagination } from 'src/app/_models/pagination';
import { FirstReleaseApproval, Review } from 'src/app/_models/review';
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
  @Input() clearTableFiltersFlag : boolean | null = null;
  @ViewChild('firstReleaseApprovalAllCheck') firstReleaseApprovalAllCheck!: ElementRef<HTMLInputElement>;

  reviewPageWebAppUrl : string = environment.webAppUrl + "Assemblies/Review/";
  profilePageWebAppUrl : string = environment.webAppUrl + "Assemblies/Profile/";
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

  sidebarVisible : boolean = false;

  // Filters
  details: any[] = [];
  selectedDetails: any[] = [];
  showDeletedAPIRevisions : boolean = false;
  showAPIRevisionsAssignedToMe : boolean = false;
  @Output() firstReleaseApprovalEmitter : EventEmitter<FirstReleaseApproval> = new EventEmitter<FirstReleaseApproval>();

  // Context Menu
  contextMenuItems! : MenuItem[];
  selectedRevision!: Revision;
  selectedRevisions!: Revision[];
  showSelectionActions : boolean = false;
  showDiffButton : boolean = false;

  // Messages
  apiRevisionsListDetail: string = "APIRevision(s) from"

  badgeClass : Map<string, string> = new Map<string, string>();

  constructor(private revisionsService: RevisionsService) { }

  ngOnInit(): void {
    this.createFilters();
    this.createContextMenuItems();
    this.setDetailsIcons();
    this.loadRevisions(0, this.pageSize * 2, true);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['review'] && changes['review'].previousValue != changes['review'].currentValue){
      if (this.showAPIRevisionsAssignedToMe)
      {
        this.toggleShowAPIRevisionsAssignedToMe();
      }
      else {
        this.loadRevisions(0, this.pageSize * 2, true);
      }
      this.showSelectionActions = false;
      this.showDiffButton = false;
    }
    
    if (changes['clearTableFiltersFlag'] && changes['clearTableFiltersFlag'].currentValue) {
      if (this.clearTableFiltersFlag) {
        this.clearTableFiltersFlag = false;
        this.firstReleaseApprovalAllCheck.nativeElement.checked = true;
        this.updateFirstReleaseApproval("All");
      }
    }
  }

  /**
   * Load revision from API
   *  * @param append wheather to add to or replace existing list
   */
  loadRevisions(noOfItemsRead : number, pageSize: number, resetReviews = false, filters: any = null, sortField: string ="lastUpdatedOn",  sortOrder: number = 1) {
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

    this.revisionsService.getAPIRevisions(noOfItemsRead, pageSize, reviewId, label, author, details, sortField, sortOrder, 
      this.showDeletedAPIRevisions, this.showAPIRevisionsAssignedToMe).subscribe({
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
    return (
      this.sortField != "lastUpdatedOn" || this.sortOrder != 1 || 
      (this.filters && (this.filters.label.value != null || this.filters.author.value != null || this.filters.details.value != null)) ||
      this.showDeletedAPIRevisions || this.showAPIRevisionsAssignedToMe);
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
    this.showAPIRevisionsAssignedToMe = false;
    this.loadRevisions(0, this.pageSize * 2, true);
    this.createContextMenuItems();
    this.updateAPIRevisoinsListDetails();
  }

  /**
  * Toggle Show APIRevisions Assigned to Me
  */
  toggleShowAPIRevisionsAssignedToMe() {
    this.showAPIRevisionsAssignedToMe = !this.showAPIRevisionsAssignedToMe;
    this.showDeletedAPIRevisions = false;
    if (this.showAPIRevisionsAssignedToMe) {
      this.review = null;
    }
    this.loadRevisions(0, this.pageSize * 2, true);
    this.createContextMenuItems();
    this.updateAPIRevisoinsListDetails();
  }

  updateAPIRevisoinsListDetails() {
    let msg = "APIRevision(s)";
    if (this.showDeletedAPIRevisions)
    {
      msg = "Deleted " + msg;
    }
    if (this.showAPIRevisionsAssignedToMe)
    {
      msg = msg + " Assigned to Me";
    }
    msg = msg + " from";
    this.apiRevisionsListDetail = msg;
  }

  updateFirstReleaseApproval(value : string) {
    const firstReleaseApproval =  FirstReleaseApproval[value as keyof typeof FirstReleaseApproval];
    this.firstReleaseApprovalEmitter.emit(firstReleaseApproval);
    if (value != "All") {
      this.review = null;
      this.revisions = [];
    }
  }

  /**
   * Callback to invoke on scroll /lazy load.
   * @param event the lazyload event
   */
  onLazyLoad(event: TableLazyLoadEvent) {
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
    this.loadRevisions(0, this.pageSize, true, event.filters);
  }

  /**
   * Callback to invoke on table selection.
   * @param event the Filter event
   */
  onSelectionChange(value = []) {
    this.selectedRevisions = value;
    this.showSelectionActions = (value.length > 0) ? true : false;
    this.showDiffButton = (value.length == 2) ? true : false;
  }

  /**
   * Callback to invoke on column sort.
   * @param event the Filter event
   */
  onSort(event: SortEvent) {
      this.loadRevisions(0, this.pageSize, true, null, event.field, event.order);
    }
}
