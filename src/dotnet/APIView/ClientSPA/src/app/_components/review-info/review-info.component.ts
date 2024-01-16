import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { DropdownChangeEvent } from 'primeng/dropdown';
import { Review } from 'src/app/_models/review';
import { Revision } from 'src/app/_models/revision';

@Component({
  selector: 'app-review-info',
  templateUrl: './review-info.component.html',
  styleUrls: ['./review-info.component.scss']
})
export class ReviewInfoComponent implements OnInit {
  @Input() review : Review | undefined = undefined;
  @Input() reviewRevisions : Map<string, Revision[]> = new Map<string, Revision[]>();
  @Output() revisionsSidePanel : EventEmitter<boolean> = new EventEmitter<boolean>();

  breadCrumbItems: MenuItem[] | undefined;
  breadCrumbHome: MenuItem | undefined;

  revisionsTypeDropDown: any[] = [];
  selectedRevisionsType: any | undefined;

  revisionsDropDown: any[] = [];
  selectedRevisionsDropDown: any | undefined;

  diffRevisionsTypeDropDown: any[] = [];
  selectedDiffRevisionsType: any | undefined;

  diffRevisionsDropDown: any[] = [];
  selecteddiffRevisionsDropDown: any | undefined;

  badgeClass : Map<string, string> = new Map<string, string>();

  constructor() {
    this.revisionsTypeDropDown = this.getReviewRevisionType();
    this.diffRevisionsTypeDropDown = this.getReviewRevisionType();
    this.selectedRevisionsType = this.revisionsTypeDropDown[0];
    this.selectedDiffRevisionsType = this.diffRevisionsTypeDropDown[0];

    // Set Badge Class for Icons
    this.badgeClass.set("Pending", "fa-solid fa-circle-minus text-warning");
    this.badgeClass.set("Approved", "fas fa-check-circle text-success");
    this.badgeClass.set("Manual", "fa-solid fa-arrow-up-from-bracket");
    this.badgeClass.set("PullRequest", "fa-solid fa-code-pull-request");
    this.badgeClass.set("Automatic", "fa-solid fa-robot");
  }

  ngOnInit() {
    this.breadCrumbItems = [{ label: 'Review' }, { label: 'Microsoft.Azure.Functions.Worker.Extensions.ServiceBus', icon: 'me-2 pi pi-code' },
    { label: 'Manual | settlement actions Manual | 10/6/2023 3:40:04 PM | JoshLove-msft', icon: 'me-2 bi bi-clock-history' }, { label: 'Auto | settlement actions Auto | 10/6/2023 3:40:04 PM | JoshLove-msft', icon: 'me-2 bi bi-file-diff' }
  ];
    this.breadCrumbHome = { icon: 'pi pi-home', routerLink: '/' };
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes["reviewRevisions"].currentValue && changes["reviewRevisions"].currentValue.size > 0 ) {
      this.revisionsDropDown = this.getReviewRevisionsDropDown(this.selectedRevisionsType);
      this.diffRevisionsDropDown = this.getReviewRevisionsDropDown(this.selectedDiffRevisionsType);
    }
  }

  getReviewRevisionType() {
    return [
      { name: 'Manual', value: 'Manual' },
      { name: 'Automatic', value: 'Automatic' },
      { name: 'Pull Request', value: 'PullRequest' }
    ];
  }

  onRevisionTypeChange(event: DropdownChangeEvent) {
    this.revisionsDropDown = this.getReviewRevisionsDropDown(this.selectedRevisionsType);
  }

  onDiffRevisionTypeChange(event: DropdownChangeEvent) {
    this.diffRevisionsDropDown = this.getReviewRevisionsDropDown(this.selectedDiffRevisionsType);
  }

  showRevisionSidePanel() {
    this.revisionsSidePanel.emit(true);
  }

  /**
   * Retrieve revision of a specified type.
   * @param selectedType the selected type for revision or diff revision
   */
  getReviewRevisionsDropDown(selectedType : any) {
    const revisions : any[] = [];
    this.reviewRevisions.get(selectedType.value)?.forEach((revision: { label: any; id: any; }) => {
      revisions.push({ name: revision.label ?? revision.id, value: revision.id });
    });
    return revisions;
  }
}
