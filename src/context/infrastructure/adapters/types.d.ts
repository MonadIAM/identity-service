import { FilterQuery, FindOptions, QueryOrder } from "@mikro-orm/postgresql";

import { LinkFilterDTO, OrdinalFilterDTO, StringFilterDTO } from "~common/dto";

declare global {
    namespace Adapters {
        type Meta = {
            Filters: unknown;
            Sort: unknown;
        };

        interface Contract<E, A extends Meta> {
            buildOptionsORM<P extends string, F extends string>(
                sort: A["Sort"],
                pagination: Pagination,
                options?: FindOptions<E, P, F>,
            ): FindOptions<E, P, F>;

            buildWhereORM(filters: A["Filters"], basic?: FilterQuery<E>): FilterQuery<E>;
        }

        namespace Account {
            type DefaultFilters = {
                updatedAt?: OrdinalFilterDTO<Date>;
                createdAt?: OrdinalFilterDTO<Date>;
                subject?: StringFilterDTO;
                status?: StringFilterDTO;
                email?: StringFilterDTO;
                phone?: StringFilterDTO;
                name?: StringFilterDTO;
                id?: StringFilterDTO;
                is2FAEnforced?: boolean;
            };

            type ManageFilters = DefaultFilters & {
                realm?: LinkFilterDTO;
            };

            type Filters = DefaultFilters & ManageFilters;

            type Sort = {
                createdAt?: QueryOrder;
                updatedAt?: QueryOrder;
            };

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace AuditLog {
            type Filters = {
                createdAt?: OrdinalFilterDTO<Date>;
                actionType?: StringFilterDTO;
                entityType?: StringFilterDTO;
                userAgent?: StringFilterDTO;
                id?: StringFilterDTO;
                ip?: StringFilterDTO;
                realm?: LinkFilterDTO;
                actor?: LinkFilterDTO;
            };

            type Sort = {
                createdAt?: QueryOrder;
            };

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace ChangeLog {
            type Filters = {
                createdAt?: OrdinalFilterDTO<Date>;
                changeType?: StringFilterDTO;
                entityType?: StringFilterDTO;
                auditEntry?: StringFilterDTO;
                entity?: StringFilterDTO;
                id?: StringFilterDTO;
            };

            type Sort = {
                createdAt?: QueryOrder;
            };

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace Identifier {
            type Filters = {
                verifiedAt?: OrdinalFilterDTO<Date>;
                lastUsedAt?: OrdinalFilterDTO<Date>;
                createdAt?: OrdinalFilterDTO<Date>;
                provider?: StringFilterDTO;
                email?: StringFilterDTO;
                phone?: StringFilterDTO;
                id?: StringFilterDTO;
                account?: LinkFilterDTO;
                receiveNotifications?: boolean;
                isPublicContact?: boolean;
                isVerified?: boolean;
            };

            type Sort = {
                verifiedAt?: QueryOrder;
                lastUsedAt?: QueryOrder;
                createdAt?: QueryOrder;
            };

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace MasterCode {
            type Filters = {};

            type Sort = {
                createdAt?: QueryOrder;
            };

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace PasswordHistory {
            type Filters = {};

            type Sort = {
                setAt?: QueryOrder;
            };

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace Password {
            type Filters = {};

            type Sort = {
                setAt?: QueryOrder;
            };

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace Profile {
            type Filters = {};

            type Sort = {
                updatedAt?: QueryOrder;
            };

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace RecoveryCode {
            type Filters = {};

            type Sort = {
                createdAt?: QueryOrder;
                usedAt?: QueryOrder;
            };

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace SecondFactor {
            type Filters = {};

            type Sort = {
                confirmedAt?: QueryOrder;
                lastUsedAt?: QueryOrder;
                createdAt?: QueryOrder;
            };

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace Session {
            type Filters = {};

            type Sort = {
                lastRefreshedAt?: QueryOrder;
                expiresAt?: QueryOrder;
                createdAt?: QueryOrder;
            };

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }

        namespace Membership {
            type Filters = {};

            type Sort = {
                createdAt?: QueryOrder;
            };

            interface Types {
                Filters: Filters;
                Sort: Sort;
            }
        }
    }
}
