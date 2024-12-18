import Store from "electron-store";

class StoreManager {
  private store: Store<{ connections: DatabaseConnection[] }>;

  constructor() {
    this.store = new Store<{ connections: DatabaseConnection[] }>();
  }

  public getConnections(): DatabaseConnection[] {
    return this.store.get("connections", []);
  }

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

  public removeConnection(connectionToRemove: DatabaseConnection): void {
    const connections = this.getConnections().filter(
      (conn) => JSON.stringify(conn) !== JSON.stringify(connectionToRemove)
    );
    this.store.set("connections", connections);
  }

  public clearConnections(): void {
    this.store.delete("connections");
  }
}

export const storeManager = new StoreManager();
