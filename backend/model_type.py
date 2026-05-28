from datetime import datetime, date, time, timedelta
from enum import Enum
from typing import Type, Optional, Any, Union, List, Dict, Set, Tuple, get_args, get_origin, Annotated
import json
import logging

from decimal import Decimal
from pendulum import DateTime, Date, Time, Duration
from pydantic import BaseModel, RootModel, TypeAdapter, ValidationError
from pydantic import GetCoreSchemaHandler
from pydantic_core import core_schema
from sqlalchemy import Column
from sqlalchemy import TypeDecorator, JSON as SQLAlchemyJSON, DateTime as SADateTime, Date as SADate, Time as SATime, Interval
from sqlmodel import Field
from sqlmodel import SQLModel
from uuid import UUID
import pendulum

class PDateTime(TypeDecorator):
    """
    pendulum.DateTime <-> datetime + timezone
    支持 SQLAlchemy 和 Pydantic/SQLModel
    """
    impl = SADateTime(timezone=True)
    cache_ok = True
    python_type = DateTime
    def process_bind_param(self, value: Any, dialect) -> Optional[datetime]:
        if value is None:
            return None
        try:
            pdt = self._to_pendulum(value)
            if pdt is None:
                return None
            return pdt.in_tz('UTC')
        except Exception as e:
            logging.warning(f"Failed to process bind param: {e}")
            return None
    def process_result_value(self, value: Any, dialect) -> Optional[DateTime]:
        if value is None:
            return None
        if isinstance(value, datetime):
            if value.tzinfo:
                return pendulum.instance(value)
            return pendulum.instance(value, tz='UTC')
        return None
    def _to_pendulum(self, value: Any) -> Optional[DateTime]:
        if isinstance(value, DateTime):
            return value
        if isinstance(value, datetime):
            if value.tzinfo:
                return pendulum.instance(value)
            return pendulum.instance(value, tz=pendulum.local_timezone())
        if isinstance(value, str):
            try:
                return pendulum.parse(value)
            except:
                return None
        if isinstance(value, (int, float)):
            return pendulum.from_timestamp(value, tz=pendulum.local_timezone())
        return None
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        """Pydantic v2 核心 schema"""
        def validate(value: Any) -> Optional[DateTime]:
            if value is None:
                return None
            instance = cls()
            return instance._to_pendulum(value)
        def serialize(value: Optional[DateTime]) -> Optional[str]:
            if value is None:
                return None
            if isinstance(value, DateTime):
                return value.isoformat()
            if isinstance(value, datetime):
                return value.isoformat()
            return str(value)
        python_schema = core_schema.no_info_after_validator_function(
            validate,
            core_schema.any_schema(),
        )
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=python_schema,
            serialization=core_schema.plain_serializer_function_ser_schema(
                serialize,
                return_schema=core_schema.str_schema(),
                when_used='json'
            )
        )
class PDate(TypeDecorator):
    """pendulum.Date <-> date"""
    impl = SADate
    cache_ok = True
    python_type = Date
    def process_bind_param(self, value: Any, dialect) -> Optional[date]:
        if value is None:
            return None
        try:
            if isinstance(value, Date):
                return date(value.year, value.month, value.day)
            if isinstance(value, date):
                return value
            if isinstance(value, str):
                parsed = pendulum.parse(value)
                return date(parsed.year, parsed.month, parsed.day)
            if hasattr(value, 'year'):
                return date(value.year, value.month, value.day)
        except Exception:
            pass
        return None
    def process_result_value(self, value: Any, dialect) -> Optional[Date]:
        if value is None:
            return None
        return pendulum.date(value.year, value.month, value.day)
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        """Pydantic v2 核心 schema"""
        def validate(value: Any) -> Optional[Date]:
            if value is None:
                return None
            if isinstance(value, Date):
                return value
            if isinstance(value, date):
                return pendulum.date(value.year, value.month, value.day)
            if isinstance(value, str):
                parsed = pendulum.parse(value)
                return pendulum.date(parsed.year, parsed.month, parsed.day)
            return None
        def serialize(value: Optional[Date]) -> Optional[str]:
            if value is None:
                return None
            if isinstance(value, Date):
                return value.to_date_string()
            if isinstance(value, date):
                return value.isoformat()
            return str(value)
        python_schema = core_schema.no_info_after_validator_function(
            validate,
            core_schema.any_schema(),
        )
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=python_schema,
            serialization=core_schema.plain_serializer_function_ser_schema(
                serialize,
                return_schema=core_schema.str_schema(),
                when_used='json'
            )
        )
class PTime(TypeDecorator):
    """pendulum.Time <-> time"""
    impl = SATime
    cache_ok = True
    python_type = Time
    def process_bind_param(self, value: Any, dialect) -> Optional[time]:
        if value is None:
            return None
        try:
            if isinstance(value, Time):
                return time(value.hour, value.minute, value.second, value.microsecond)
            if isinstance(value, time):
                return value
            if isinstance(value, str):
                parsed = pendulum.parse(value)
                return time(parsed.hour, parsed.minute, parsed.second, parsed.microsecond)
            if hasattr(value, 'hour'):
                return time(value.hour, value.minute, value.second,
                           getattr(value, 'microsecond', 0))
        except Exception:
            pass
        return None
    def process_result_value(self, value: Any, dialect) -> Optional[Time]:
        if value is None:
            return None
        return pendulum.time(value.hour, value.minute, value.second, value.microsecond)
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        """Pydantic v2 核心 schema"""
        def validate(value: Any) -> Optional[Time]:
            if value is None:
                return None
            if isinstance(value, Time):
                return value
            if isinstance(value, time):
                return pendulum.time(value.hour, value.minute, value.second, value.microsecond)
            if isinstance(value, str):
                parsed = pendulum.parse(value)
                return pendulum.time(parsed.hour, parsed.minute, parsed.second, parsed.microsecond)
            return None
        def serialize(value: Optional[Time]) -> Optional[str]:
            if value is None:
                return None
            if isinstance(value, Time):
                return value.to_time_string()
            if isinstance(value, time):
                return value.isoformat()
            return str(value)
        python_schema = core_schema.no_info_after_validator_function(
            validate,
            core_schema.any_schema(),
        )
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=python_schema,
            serialization=core_schema.plain_serializer_function_ser_schema(
                serialize,
                return_schema=core_schema.str_schema(),
                when_used='json'
            )
        )
class PDuration(TypeDecorator):
    """pendulum.Duration <-> interval"""
    impl = Interval
    cache_ok = True
    python_type = Duration
    def process_bind_param(self, value: Any, dialect) -> Optional[timedelta]:
        if value is None:
            return None
        if isinstance(value, Duration):
            return timedelta(seconds=value.total_seconds())
        if isinstance(value, timedelta):
            return value
        if isinstance(value, (int, float)):
            return timedelta(seconds=value)
        return None
    def process_result_value(self, value: Any, dialect) -> Optional[Duration]:
        if value is None:
            return None
        return pendulum.duration(seconds=value.total_seconds())
    @classmethod
    def __get_pydantic_core_schema__(
        cls, source_type: Any, handler: GetCoreSchemaHandler
    ) -> core_schema.CoreSchema:
        """Pydantic v2 核心 schema"""
        def validate(value: Any) -> Optional[Duration]:
            if value is None:
                return None
            if isinstance(value, Duration):
                return value
            if isinstance(value, timedelta):
                return pendulum.duration(seconds=value.total_seconds())
            if isinstance(value, (int, float)):
                return pendulum.duration(seconds=value)
            return None
        def serialize(value: Optional[Duration]) -> Optional[float]:
            if value is None:
                return None
            if isinstance(value, Duration):
                return value.total_seconds()
            if isinstance(value, timedelta):
                return value.total_seconds()
            return float(value)
        python_schema = core_schema.no_info_after_validator_function(
            validate,
            core_schema.any_schema(),
        )
        return core_schema.json_or_python_schema(
            json_schema=core_schema.float_schema(),
            python_schema=python_schema,
            serialization=core_schema.plain_serializer_function_ser_schema(
                serialize,
                return_schema=core_schema.float_schema(),
                when_used='json'
            )
        )
PydanticDateTime = Annotated[DateTime, PDateTime]
PydanticDateTimeOptional = Annotated[Optional[DateTime], PDateTime]
PydanticDate = Annotated[Date, PDate]
PydanticDateOptional = Annotated[Optional[Date], PDate]
PydanticTime = Annotated[Time, PTime]
PydanticTimeOptional = Annotated[Optional[Time], PTime]
PydanticDuration = Annotated[Duration, PDuration]
PydanticDurationOptional = Annotated[Optional[Duration], PDuration]
PendulumDateTime = Annotated[
    DateTime,
    PDateTime,
    Field(sa_column=Column(PDateTime))
]
PendulumDateTimeNow = Annotated[
    DateTime,
    PDateTime,
    Field(
        default_factory=pendulum.now,
        sa_column=Column(PDateTime, nullable=False)
    )
]
PendulumDateTimeOptional = Annotated[
    Optional[DateTime],
    PDateTime,
    Field(default=None, sa_column=Column(PDateTime, nullable=True))
]
PendulumDate = Annotated[
    Date,
    PDate,
    Field(sa_column=Column(PDate))
]
PendulumDateOptional = Annotated[
    Optional[Date],
    PDate,
    Field(default=None, sa_column=Column(PDate, nullable=True))
]
PendulumTime = Annotated[
    Time,
    PTime,
    Field(sa_column=Column(PTime))
]
PendulumTimeOptional = Annotated[
    Optional[Time],
    PTime,
    Field(default=None, sa_column=Column(PTime, nullable=True))
]
SQLModel.model_config = {
    **SQLModel.model_config,
    'arbitrary_types_allowed': True,
    'json_encoders': {
        DateTime: lambda v: v.isoformat() if v else None,
        Date: lambda v: v.to_date_string() if v else None,
        Time: lambda v: v.to_time_string() if v else None,
        Duration: lambda v: v.total_seconds() if v else None,
        datetime: lambda v: v.isoformat() if v else None,
        date: lambda v: v.isoformat() if v else None,
        time: lambda v: v.isoformat() if v else None,
        timedelta: lambda v: v.total_seconds() if v else None,
    }
}
def is_pydantic_root_model(model_type) -> bool:
    try:
        return issubclass(model_type, RootModel)
    except (TypeError, AttributeError):
        return False
def is_pydantic_base_model(model_type) -> bool:
    try:
        return issubclass(model_type, BaseModel) and not issubclass(model_type, RootModel)
    except (TypeError, AttributeError):
        return False
class PydanticType(TypeDecorator):
    impl = SQLAlchemyJSON
    cache_ok = True
    def __init__(self, pydantic_type: Type, strict: bool = False, validate_on_write: bool = True):
        super().__init__()
        self.pydantic_type = pydantic_type
        self.strict = strict
        self.validate_on_write = validate_on_write
        self._analyze_type()
        try:
            self.type_adapter = TypeAdapter(pydantic_type)
        except Exception as e:
            logging.warning(f"Failed to create TypeAdapter for {pydantic_type}: {e}")
            self.type_adapter = None
    def _analyze_type(self):
        origin = get_origin(self.pydantic_type)
        args = get_args(self.pydantic_type)
        self.is_base_model = is_pydantic_base_model(self.pydantic_type)
        self.is_root_model = is_pydantic_root_model(self.pydantic_type)
        self.is_union = origin is Union
        self.is_optional = False
        self.is_list = origin in (list, List)
        self.is_dict = origin in (dict, Dict)
        self.is_set = origin in (set, Set)
        self.is_tuple = origin in (tuple, Tuple)
        if self.is_union and type(None) in args:
            self.is_optional = True
            self.inner_types = [arg for arg in args if arg is not type(None)]
            if len(self.inner_types) == 1:
                self.is_union = False
                self.inner_type = self.inner_types[0]
            else:
                self.inner_type = None
        elif self.is_union:
            self.inner_types = list(args)
            self.inner_type = None
        elif origin and args:
            self.inner_type = args[0] if len(args) == 1 else args
            self.inner_types = list(args)
        else:
            self.inner_type = None
            self.inner_types = []
        self.is_basic_type = self.pydantic_type in (
            str, int, float, bool, dict, list, set, tuple,
            type(None), bytes, bytearray
        )
        self.is_special_type = self.pydantic_type in (
            datetime, date, time, timedelta, UUID, Decimal
        ) or (isinstance(self.pydantic_type, type) and issubclass(self.pydantic_type, Enum))
    def _serialize_value(self, value: Any) -> Any:
        if value is None:
            return None
        if isinstance(value, BaseModel):
            return json.loads(value.model_dump_json())
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, date):
            return value.isoformat()
        if isinstance(value, time):
            return value.isoformat()
        if isinstance(value, timedelta):
            return value.total_seconds()
        if isinstance(value, UUID):
            return str(value)
        if isinstance(value, Decimal):
            return float(value)
        if isinstance(value, Enum):
            return value.value
        if isinstance(value, bytes):
            return value.decode('utf-8', errors='ignore')
        if isinstance(value, bytearray):
            return bytes(value).decode('utf-8', errors='ignore')
        if isinstance(value, set):
            return list(value)
        if isinstance(value, tuple):
            return list(value)
        if isinstance(value, list):
            return [self._serialize_value(item) for item in value]
        if isinstance(value, dict):
            return {
                str(k): self._serialize_value(v) 
                for k, v in value.items()
            }
        return value
    def process_bind_param(self, value: Any, dialect) -> Optional[Any]:
        if value is None:
            return None
        try:
            if self.type_adapter and self.validate_on_write:
                try:
                    if self.strict:
                        validated = self.type_adapter.validate_python(value, strict=True)
                    else:
                        validated = self.type_adapter.validate_python(value)
                    if isinstance(validated, BaseModel):
                        return json.loads(validated.model_dump_json())
                    else:
                        return self._serialize_value(validated)
                except ValidationError as e:
                    if self.strict:
                        raise
                    logging.warning(f"Validation failed for {self.pydantic_type}: {e}")
                    return self._serialize_value(value)
            return self._serialize_value(value)
        except Exception as e:
            logging.error(f"Failed to process bind param: {e}")
            if self.strict:
                raise
            if isinstance(value, (dict, list, str, int, float, bool, type(None))):
                return value
            return str(value)
    def process_result_value(self, value: Any, dialect) -> Optional[Any]:
        if value is None:
            return None
        try:
            if self.type_adapter:
                try:
                    result = self.type_adapter.validate_python(value)
                    return result
                except ValidationError as e:
                    if self.strict:
                        raise
                    logging.warning(f"Failed to deserialize with TypeAdapter: {e}")
            return self._manual_deserialize(value)
        except Exception as e:
            logging.error(f"Failed to process result value: {e}")
            if self.strict:
                raise
            return value
    def _manual_deserialize(self, value: Any) -> Any:
        if value is None:
            return None
        if self.is_base_model and isinstance(value, dict):
            try:
                return self.pydantic_type(**value)
            except Exception as e:
                logging.warning(f"Failed to create {self.pydantic_type.__name__}: {e}")
                return value
        if self.is_root_model:
            try:
                return self.pydantic_type(value)
            except Exception as e:
                logging.warning(f"Failed to create RootModel: {e}")
                return value
        if self.is_union and self.inner_types:
            for type_option in self.inner_types:
                try:
                    if is_pydantic_base_model(type_option) and isinstance(value, dict):
                        return type_option(**value)
                    elif type_option is not type(None):
                        adapter = TypeAdapter(type_option)
                        return adapter.validate_python(value)
                except:
                    continue
            return value
        if self.is_optional and self.inner_type:
            if value is None:
                return None
            try:
                if is_pydantic_base_model(self.inner_type) and isinstance(value, dict):
                    return self.inner_type(**value)
                else:
                    adapter = TypeAdapter(self.inner_type)
                    return adapter.validate_python(value)
            except:
                return value
        if self.is_list and isinstance(value, list):
            if self.inner_type and is_pydantic_base_model(self.inner_type):
                result = []
                for item in value:
                    try:
                        if isinstance(item, dict):
                            result.append(self.inner_type(**item))
                        else:
                            result.append(item)
                    except:
                        result.append(item)
                return result
            return value
        if self.is_dict and isinstance(value, dict):
            if len(self.inner_types) == 2:
                value_type = self.inner_types[1]
                if is_pydantic_base_model(value_type):
                    result = {}
                    for k, v in value.items():
                        try:
                            if isinstance(v, dict):
                                result[k] = value_type(**v)
                            else:
                                result[k] = v
                        except:
                            result[k] = v
                    return result
            return value
        if self.is_set and isinstance(value, list):
            return set(value)
        if self.is_tuple and isinstance(value, list):
            return tuple(value)
        return value
    def copy(self, **kw):
        return PydanticType(
            self.pydantic_type, 
            strict=self.strict, 
            validate_on_write=self.validate_on_write
        )
    def __repr__(self):
        return f"PydanticType({self.pydantic_type}, strict={self.strict})"
def pydantic_json_type(
    model_type: Type,
    strict: bool = False,
    validate_on_write: bool = True
) -> PydanticType:
    return PydanticType(model_type, strict=strict, validate_on_write=validate_on_write)