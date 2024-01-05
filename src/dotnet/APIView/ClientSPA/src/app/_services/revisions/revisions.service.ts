import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';


import { PaginatedResult } from 'src/app/_models/pagination';
import { Revision } from 'src/app/_models/revision';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root'
})
export class RevisionsService {
  baseUrl : string = environment.apiUrl + "APIRevisions";
  paginatedResult: PaginatedResult<Revision[]> = new PaginatedResult<Revision[]>
  
  constructor(private http: HttpClient) { }

  getRevisions(noOfItemsRead: number, pageSize: number,
    reviewId : string, label: string, author: string, 
    details: string [], sortField: string, sortOrder: number
    ): Observable<PaginatedResult<Revision[]>> {
    let params = new HttpParams();
    params = params.append('noOfItemsRead', noOfItemsRead);
    params = params.append('pageSize', pageSize);

    const data = {
      label: label,
      author: author,
      reviewId: reviewId,
      details: details,
      sortField: sortField,
      sortOrder: sortOrder
    };

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    })
   

    console.log("getRevisions: " + JSON.stringify(data));
    
    return this.http.post<Revision[]>(this.baseUrl, data,
      { 
        headers:headers,
        params: params,
        observe: 'response', 
        withCredentials: true 
      } ).pipe(
          map((response : any) => {
            if (response.body) {
              this.paginatedResult.result = response.body;
            }
            const pagination = response.headers.get('Pagination');
            if (pagination){
              this.paginatedResult.pagination = JSON.parse(pagination);
            }
            return this.paginatedResult;
          }
        )
      );
  }

  openDiffOfAPIRevisions(reviewId: string, activeAPIRevisionId: string, diffAPIRevisionsId: string)
  {
    window.open(environment.webAppUrl + `Assemblies/Review/${reviewId}?revisionId=${activeAPIRevisionId}&diffOnly=False&doc=False&diffRevisionId=${diffAPIRevisionsId}`, '_blank');
  }

  openAPIRevisionPage(reviewId: string, activeAPIRevisionId: string)
  {
    window.open(environment.webAppUrl + `Assemblies/Review/${reviewId}?revisionId=${activeAPIRevisionId}`, '_blank');
  }
}
