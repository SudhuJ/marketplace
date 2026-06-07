// Mock Supabase client for development
// Supports full chaining pattern: supabase.from('table').select().eq().single()

let mockUser: { id: string; email: string; user_metadata: Record<string, any> } | null = null;

// Mock data
const mockData = {
  categories: [
    { id: "cat-1", name: "Electronics", description: "Phones, laptops, gadgets", created_at: new Date().toISOString() },
    { id: "cat-2", name: "Clothing", description: "Apparel, shoes, accessories", created_at: new Date().toISOString() },
    { id: "cat-3", name: "Home & Garden", description: "Furniture, decor, appliances", created_at: new Date().toISOString() }
  ],
  listings: [
    {
      id: "list-1",
      user_id: "user-1",
      title: "Used iPhone 12",
      description: "Great condition, lightly used",
      price: 400,
      category_id: "cat-1",
      condition: "good",
      images: ["https://example.com/iphone.jpg"],
      is_sold: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: "list-2",
      user_id: "user-1",
      title: "Vintage Wooden Chair",
      description: "Beautiful vintage chair",
      price: 75,
      category_id: "cat-3",
      condition: "fair",
      images: ["https://example.com/chair.jpg"],
      is_sold: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  profiles: [
    { id: "user-1", full_name: "Test User", avatar_url: "", bio: "", website: "", location: "", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ],
  messages: []
};

// Helper to filter data based on conditions
const filterData = (table: string, conditions: Array<{column: string, operator: string, value: any}>) => {
  let data: any[] = [];
  
  // Get base data for table
  if (table === "categories") {
    data = [...mockData.categories];
  } else if (table === "listings") {
    data = [...mockData.listings];
  } else if (table === "profiles") {
    data = [...mockData.profiles];
  } else if (table === "messages") {
    data = [...mockData.messages];
  }
  
  // Apply conditions
  conditions.forEach(condition => {
    const { column, operator, value } = condition;
    switch (operator) {
      case "eq":
        data = data.filter(item => item[column] === value);
        break;
      case "neq":
        data = data.filter(item => item[column] !== value);
        break;
      case "gt":
        data = data.filter(item => item[column] > value);
        break;
      case "gte":
        data = data.filter(item => item[column] >= value);
        break;
      case "lt":
        data = data.filter(item => item[column] < value);
        break;
      case "lte":
        data = data.filter(item => item[column] <= value);
        break;
      case "like":
        data = data.filter(item => String(item[column]).includes(String(value)));
        break;
      case "ilike":
        // Case-insensitive like (simplified)
        data = data.filter(item => String(item[column]).toLowerCase().includes(String(value).toLowerCase()));
        break;
    }
  });
  
  return data;
};

export const supabase = {
  auth: {
    signUp: async (params: { email: string; password: string }) => {
      // Create mock user
      mockUser = {
        id: `user-${Date.now()}`,
        email: params.email,
        user_metadata: {}
      };
      
      // Create session
      const session = {
        access_token: `mock-token-${mockUser.id}`,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: `mock-refresh-${mockUser.id}`,
        user: mockUser
      };
      
      return { data: { user: mockUser, session }, error: null };
    },
    signInWithPassword: async (params: { email: string; password: string }) => {
      // Accept any credentials in mock mode
      mockUser = {
        id: `user-${params.email.split('@')[0]}`,
        email: params.email,
        user_metadata: {}
      };
      
      const session = {
        access_token: `mock-token-${mockUser.id}`,
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: `mock-refresh-${mockUser.id}`,
        user: mockUser
      };
      
      return { data: { user: mockUser, session }, error: null };
    },
    signOut: async () => {
      mockUser = null;
      return { data: null, error: null };
    },
    getSession: async () => {
      if (mockUser) {
        const session = {
          access_token: `mock-token-${mockUser.id}`,
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: `mock-refresh-${mockUser.id}`,
          user: mockUser
        };
        return { data: { session } };
      }
      return { data: { session: null } };
    },
    onAuthStateChange: () => {
      const callback = (arg0: any) => {};
      return { data: { subscription: { unsubscribe: () => {} } } };
    }
  },
  from: <T = any>(table: string) => {
    // Return a mock query builder that supports our usage patterns
    let conditions: Array<{column: string, operator: string, value: any}> = [];
    let orderBy: {column: string, ascending: boolean} | null = null;
    
    // This is the query builder object that gets returned from .select()
    const queryBuilder = {
      // For awaiting: await supabase.from('table').select('*')
      then: <TResult>(onfulfilled?: (value: any) => TResult | PromiseLike<TResult>, onrejected?: (reason: any) => any): Promise<TResult> => {
        // Get filtered data based on conditions
        let data: any[] = filterData(table, conditions);
        
        // Apply ordering if specified
        if (orderBy) {
          data = data.sort((a, b) => {
            if (a[orderBy.column] < b[orderBy.column]) return orderBy.ascending ? -1 : 1;
            if (a[orderBy.column] > b[orderBy.column]) return orderBy.ascending ? 1 : -1;
            return 0;
          });
        }
        
        // If onfulfilled is provided, call it with our mock response
        if (onfulfilled) {
          return Promise.resolve(onfulfilled({ data, error: null }));
        }
        // Otherwise return a promise that resolves to our mock response
        return Promise.resolve({ data, error: null } as any);
      },
      
      // For chaining: supabase.from('table').select('*').eq(...)
      eq: (column: string, value: any) => {
        conditions.push({column, operator: "eq", value});
        return queryBuilder; // Return same object for chaining
      },
      
      neq: (column: string, value: any) => {
        conditions.push({column, operator: "neq", value});
        return queryBuilder;
      },
      
      gt: (column: string, value: any) => {
        conditions.push({column, operator: "gt", value});
        return queryBuilder;
      },
      
      gte: (column: string, value: any) => {
        conditions.push({column, operator: "gte", value});
        return queryBuilder;
      },
      
      lt: (column: string, value: any) => {
        conditions.push({column, operator: "lt", value});
        return queryBuilder;
      },
      
      lte: (column: string, value: any) => {
        conditions.push({column, operator: "lte", value});
        return queryBuilder;
      },
      
      like: (column: string, value: any) => {
        conditions.push({column, operator: "like", value});
        return queryBuilder;
      },
      
      ilike: (column: string, value: any) => {
        conditions.push({column, operator: "ilike", value});
        return queryBuilder;
      },
      
      order: (column: string, options: {ascending?: boolean} = {}) => {
        orderBy = {column, ascending: options.ascending !== false};
        return queryBuilder;
      },
      
      // For single(): supabase.from('table').select('*').eq(...).single()
      single: async () => {
        // Get filtered data based on conditions
        let data: any[] = filterData(table, conditions);
        
        // Apply ordering if specified
        if (orderBy) {
          data = data.sort((a, b) => {
            if (a[orderBy.column] < b[orderBy.column]) return orderBy.ascending ? -1 : 1;
            if (a[orderBy.column] > b[orderBy.column]) return orderBy.ascending ? 1 : -1;
            return 0;
          });
        }
        
        // Return single result (first match) or null
        const singleResult = data.length > 0 ? data[0] : null;
        
        return { data: singleResult, error: null };
      }
    };
    
    return {
      // For: supabase.from('table').select('*')
      select: (columns: string = "*") => {
        // Reset conditions and orderBy for each new query
        conditions = [];
        orderBy = null;
        return queryBuilder;
      },
      
      // We also use insert() in create listing page
      insert: async (record: any) => {
        // Generate a mock ID
        const newRecord = { 
          ...record, 
          id: `mock-${Date.now()}`, 
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString() 
        };
        
        // Add to appropriate mock data array
        if (table === "listings") {
          mockData.listings.push(newRecord);
        } else if (table === "profiles") {
          mockData.profiles.push(newRecord);
        }
        
        return { data: newRecord, error: null };
      },
      
      // We also use update() in edit listing page
      update: (record: any) => {
        // Return a query builder that supports chaining (like .eq())
        let updateConditions: Array<{column: string, operator: string, value: any}> = [];
        let updateOrderBy: {column: string, ascending: boolean} | null = null;
        
        const updateQueryBuilder = {
          // For awaiting: await supabase.from('table').update(...).eq(...)
          then: <TResult>(onfulfilled?: (value: any) => TResult | PromiseLike<TResult>, onrejected?: (reason: any) => any): Promise<TResult> => {
            // For mock update, just return success
            // In a real implementation, this would filter/update based on conditions
            if (onfulfilled) {
              return Promise.resolve(onfulfilled({ data: record, error: null }));
            }
            return Promise.resolve({ data: record, error: null } as any);
          },
          
          // For chaining: supabase.from('table').update(...).eq(...)
          eq: (column: string, value: any) => {
            updateConditions.push({column, operator: "eq", value});
            return updateQueryBuilder;
          },
          
          // Add other operators as needed for update chaining
          neq: (column: string, value: any) => {
            updateConditions.push({column, operator: "neq", value});
            return updateQueryBuilder;
          },
          
          gt: (column: string, value: any) => {
            updateConditions.push({column, operator: "gt", value});
            return updateQueryBuilder;
          },
          
          gte: (column: string, value: any) => {
            updateConditions.push({column, operator: "gte", value});
            return updateQueryBuilder;
          },
          
          lt: (column: string, value: any) => {
            updateConditions.push({column, operator: "lt", value});
            return updateQueryBuilder;
          },
          
          lte: (column: string, value: any) => {
            updateConditions.push({column, operator: "lte", value});
            return updateQueryBuilder;
          },
          
          like: (column: string, value: any) => {
            updateConditions.push({column, operator: "like", value});
            return updateQueryBuilder;
          },
          
          ilike: (column: string, value: any) => {
            updateConditions.push({column, operator: "ilike", value});
            return updateQueryBuilder;
          },
          
          order: (column: string, options: {ascending?: boolean} = {}) => {
            updateOrderBy = {column, ascending: options.ascending !== false};
            return updateQueryBuilder;
          }
        };
        
        return updateQueryBuilder;
      },
      
      // We also use delete()
      delete: () => {
        // Return a query builder that supports chaining (like .eq())
        let deleteConditions: Array<{column: string, operator: string, value: any}> = [];
        let deleteOrderBy: {column: string, ascending: boolean} | null = null;
        
        const deleteQueryBuilder = {
          // For awaiting: await supabase.from('table').delete().eq(...)
          then: <TResult>(onfulfilled?: (value: any) => TResult | PromiseLike<TResult>, onrejected?: (reason: any) => any): Promise<TResult> => {
            // For mock delete, just return success
            if (onfulfilled) {
              return Promise.resolve(onfulfilled({ data: null, error: null }));
            }
            return Promise.resolve({ data: null, error: null } as any);
          },
          
          // For chaining: supabase.from('table').delete().eq(...)
          eq: (column: string, value: any) => {
            deleteConditions.push({column, operator: "eq", value});
            return deleteQueryBuilder;
          },
          
          // Add other operators as needed for delete chaining
          neq: (column: string, value: any) => {
            deleteConditions.push({column, operator: "neq", value});
            return deleteQueryBuilder;
          },
          
          gt: (column: string, value: any) => {
            deleteConditions.push({column, operator: "gt", value});
            return deleteQueryBuilder;
          },
          
          gte: (column: string, value: any) => {
            deleteConditions.push({column, operator: "gte", value});
            return deleteQueryBuilder;
          },
          
          lt: (column: string, value: any) => {
            deleteConditions.push({column, operator: "lt", value});
            return deleteQueryBuilder;
          },
          
          lte: (column: string, value: any) => {
            deleteConditions.push({column, operator: "lte", value});
            return deleteQueryBuilder;
          },
          
          like: (column: string, value: any) => {
            deleteConditions.push({column, operator: "like", value});
            return deleteQueryBuilder;
          },
          
          ilike: (column: string, value: any) => {
            deleteConditions.push({column, operator: "ilike", value});
            return deleteQueryBuilder;
          },
          
          order: (column: string, options: {ascending?: boolean} = {}) => {
            deleteOrderBy = {column, ascending: options.ascending !== false};
            return deleteQueryBuilder;
          }
        };
        
        return deleteQueryBuilder;
      }
    };
  }
};