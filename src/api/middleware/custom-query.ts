import { NextFunction, Request, Response } from "express"
import { ClassConstructor } from "@medusajs/medusa/dist/types/global"
import { validator } from "@medusajs/medusa/dist/utils/validator"
import { ValidatorOptions } from "class-validator"
import { default as normalizeQuery } from "@medusajs/medusa/dist/api/middlewares/normalized-query"
import {
  prepareListQuery,
  prepareRetrieveQuery,
} from "@medusajs/medusa/dist/utils/get-query-config"
import { BaseEntity } from "@medusajs/medusa/dist/interfaces"
import { FindConfig, QueryConfig, RequestQueryFields } from "@medusajs/medusa/dist/types/common"
import { omit } from "lodash"
import { removeUndefinedProperties } from "@medusajs/medusa/dist//utils"

export function transformQuery<
  T extends RequestQueryFields,
  TEntity extends BaseEntity
>(
  plainToClass: ClassConstructor<T>,
  queryConfig?: QueryConfig<TEntity>,
  config: ValidatorOptions = {}
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      normalizeQuery()(req, res, () => void 0)
      
      // temp fix transform not working
      if (req.query.offset) req.query.offset = parseInt(req.query.offset)
      if (req.query.limit) req.query.limit = parseInt(req.query.limit)

      const validated: T = await validator<T, Record<string, unknown>>(
        plainToClass,
        req.query,
        config
      )
      req.validatedQuery = validated

      req.filterableFields = omit(validated, [
        "limit",
        "offset",
        "expand",
        "fields",
        "order",
      ])
      req.filterableFields = removeUndefinedProperties(req.filterableFields)

      if (queryConfig?.isList) {
        req.listConfig = prepareListQuery(
          validated,
          queryConfig
        ) as FindConfig<unknown>
      } else {
        req.retrieveConfig = prepareRetrieveQuery(
          validated,
          queryConfig
        ) as FindConfig<unknown>
      }

      next()
    } catch (e) {
      next(e)
    }
  }
}
