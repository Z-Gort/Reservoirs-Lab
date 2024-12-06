import Store from "electron-store";

class StoreManager {
  private store: Store<{ connections: DatabaseConnection[] }>;

  constructor() {
    this.store = new Store<{ connections: DatabaseConnection[] }>();
  }

  // Get all stored database connections
  public getConnections(): DatabaseConnection[] {
    return this.store.get("connections", []);
  }

  // Add a new database connection if it doesn't already exist
  public addConnection(connection: DatabaseConnection): void {
    const connections = this.getConnections();
    if (
      !connections.some(
        (conn) => JSON.stringify(conn) === JSON.stringify(connection)
      )
    ) {
      this.store.set("connections", [...connections, connection]);
    }
  }

  // Remove a specific database connection
  public removeConnection(connectionToRemove: DatabaseConnection): void {
    const connections = this.getConnections().filter(
      (conn) => JSON.stringify(conn) !== JSON.stringify(connectionToRemove)
    );
    this.store.set("connections", connections);
  }

  // Clear all stored connections (optional utility)
  public clearConnections(): void {
    this.store.delete("connections");
  }
}

export const storeManager = new StoreManager();
