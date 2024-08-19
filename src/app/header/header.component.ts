import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterModule,
  RouterOutlet,
  NavigationEnd,
} from '@angular/router';
import { LocalStorageService } from '../services/local-storage.service';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { ProductsService } from '../services/products.service';
import { product } from '../data-type';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    RouterLink,
    CommonModule,
    NgbPopoverModule,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'], // Use styleUrls for multiple stylesheets
})
export class HeaderComponent implements OnInit {
  // Holds the current menu type (either 'default' or 'seller')
  menuType: string = 'default';

  // Stores the seller's name, if the user is logged in as a seller
  sellerName: string = '';

  // Criteria used for searching products (name, category, or price)
  searchCriteria = {
    name: '',
    category: '',
    price: null,
  };

  // Holds the search results, which is an array of products or undefined if no results
  searchResult: undefined | product[] = [];

  // Flag to control the visibility of the search results dropdown
  searchResultVisible: boolean = false;

  constructor(
    private router: Router,
    private localStorage: LocalStorageService,
    private productsService: ProductsService
  ) {}

  // Initializes component, sets up menu type based on user's session (seller or default)
  ngOnInit(): void {
    this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        if (
          typeof window !== 'undefined' &&
          typeof localStorage !== 'undefined'
        ) {
          // Check if the user is logged in as a seller and set menuType accordingly
          if (
            this.localStorage.getItem('seller') &&
            event.url.includes('seller')
          ) {
            this.menuType = 'seller';
            let sellerNameStore = localStorage.getItem('seller');
            let sellerData = sellerNameStore && JSON.parse(sellerNameStore);
            this.sellerName = sellerData.name;
          } else {
            this.menuType = 'default';
          }
        }
      }
    });
  }

  // Capitalizes the first letter of a given string (used in search input processing)
  capitalizeFirstLetter(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  // Logs out the seller and redirects them to the seller authentication page
  logout() {
    localStorage.removeItem('seller');
    this.router.navigate(['/seller-auth']);
  }

  // Processes the user's search input and queries the ProductsService for results
  searchProduct(query: KeyboardEvent) {
    const element = query.target as HTMLInputElement;
    let searchText = element.value.trim();
    if (searchText) {
      // Capitalize the first letter of the search text
      searchText = this.capitalizeFirstLetter(searchText);
      let searchQuery: { [key: string]: any } = {};
      // If the search text is numeric, treat it as a price
      if (!isNaN(+searchText)) {
        searchQuery['price'] = searchText;
      } else if (searchText.includes(' ')) {
        // If the text has spaces, assume it's a product name
        searchQuery['name'] = searchText;
      } else {
        // Default search by category
        searchQuery['category'] = searchText;
      }

      // Query the product service for search results
      this.productsService.searchProducts(searchQuery).subscribe((result) => {
        this.searchResult = result;
        this.searchResultVisible = true; // Show search results when there is input
      });
    } else {
      // If search input is empty, clear the search results and hide the dropdown
      this.searchResult = [];
      this.searchResultVisible = false;
    }
  }

  // Shows the search results dropdown when the search input is focused
  onFocus() {
    this.searchResultVisible = true;
  }

  // Hides the search results dropdown after a short delay to allow for clicks
  onBlur() {
    setTimeout(() => {
      this.searchResultVisible = false;
    }, 200); // Delay to allow user interaction with results
  }

  // Handles item selection from the search results, navigates to the search result page
  onSelectItem(item: product) {
    this.submitSearchResult(item.name);
  }

  // Submits the search result, navigates to the search results page, and clears the dropdown
  submitSearchResult(value: String) {
    this.router.navigate([`/search/${value}`]);
    this.searchResult = [];
    this.searchResultVisible = false; // Hide search results after submitting
  }
}