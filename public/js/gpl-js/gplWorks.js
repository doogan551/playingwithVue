
function getProperFigureClass(element){
    //console.log(element,o);
    var o = null;

    switch(element.type){
            case "draw2d.shape.node.InputObj":
                o = new draw2d.shape.node.InputObj(element.id);
                break;
            case "draw2d.shape.node.OutputObj":
                o = new draw2d.shape.node.OutputObj(element.id);
                break;
            case "draw2d.shape.node.ConstantValueObj":
                o = new draw2d.shape.node.ConstantValueObj("/img/icons/Constant.svg", element.id);
                break;
            case "draw2d.shape.node.InputObjExternalPoint":
                o = new draw2d.shape.node.InputObjExternalPoint(element.id);
                break;
            case "draw2d.shape.node.InputObjExternalGPL":
                o = new draw2d.shape.node.InputObjExternalGPL(element.id);
                break;
            case "draw2d.shape.node.InputObjInternalReference":
                o = new draw2d.shape.node.InputObjInternalReference(element.id);
                break;
            case "draw2d.shape.node.OutputObjExternalPoint":
                o = new draw2d.shape.node.OutputObjExternalPoint(element.id);
                break;
            case "draw2d.shape.node.OutputObjExternalGPL":
                o = new draw2d.shape.node.OutputObjExternalGPL(element.id);
                break;
            case "draw2d.shape.node.OutputObjInternalReference":
                o = new draw2d.shape.node.OutputObjInternalReference(element.id);
                break;
            case "draw2d.shape.node.ConstantInternalReference":
                o = new draw2d.shape.node.ConstantInternalReference(element.id);
                break;
            case "draw2d.shape.node.SingleSetPointBinarySelectorObject":
                o = new draw2d.shape.node.SingleSetPointBinarySelectorObject("/img/icons/SingleSetPointBinary.svg", element.id);
                break;
            case "draw2d.shape.node.DualSetPointBinarySelectorObject":
                o = new draw2d.shape.node.DualSetPointBinarySelectorObject("/img/icons/DualSetPointBinary.svg", element.id);
                break;
            case "draw2d.shape.node.DualSetPointAnalogSelectorObject":
                o = new draw2d.shape.node.DualSetPointAnalogSelectorObject("/img/icons/DualSetPointAnalog.svg", element.id);
                break;
            case "draw2d.shape.node.SingleSetPointAnalogSelectorObject":
                o = new draw2d.shape.node.SingleSetPointAnalogSelectorObject("/img/icons/SingleSetPointAnalog.svg", element.id);
                break;
            case "draw2d.shape.node.DelayPointObject":
                o = new draw2d.shape.node.DelayPointObject("/img/icons/DelayPoint.svg", element.id);
                break;
            case "draw2d.shape.node.PulsedDelayPointObject":
                o = new draw2d.shape.node.PulsedDelayPointObject("/img/icons/PulsedDelayPoint.svg", element.id);
                break;
            case "draw2d.shape.node.LogicalPointObject":
                o = new draw2d.shape.node.LogicalPointObject("/img/icons/Logical.svg", element.id);
                break;
            case "draw2d.shape.node.MultiplexerPointObject":
                o = new draw2d.shape.node.MultiplexerPointObject("/img/icons/Multiplexer.svg", element.id);
                break;
            case "draw2d.shape.node.RampPointObject":
                o = new draw2d.shape.node.RampPointObject("/img/icons/Ramp.svg", element.id);
                break;
            case "draw2d.shape.node.TotalizerPointObject":
                o = new draw2d.shape.node.TotalizerPointObject("/img/icons/Totalizer.svg", element.id);
                break;
            case "draw2d.shape.node.AveragePointObject":
                o = new draw2d.shape.node.AveragePointObject("/img/icons/Average.svg", element.id);
                break;
            case "draw2d.shape.node.SummationPointObject":
                o = new draw2d.shape.node.SummationPointObject("/img/icons/Summation.svg", element.id);
                break;
            case "draw2d.shape.node.SelectValueLargestPointObject":
                o = new draw2d.shape.node.SelectValueLargestPointObject("/img/icons/SelectValueHigh Value.svg", element.id);
                break;
            case "draw2d.shape.node.SelectValueSmallestPointObject":
                o = new draw2d.shape.node.SelectValueSmallestPointObject("/img/icons/SelectValueLow Value.svg", element.id);
                break;
            case "draw2d.shape.node.AdditionPointSRObject":
                o = new draw2d.shape.node.AdditionPointSRObject("/img/icons/AddTrue.svg", element.id);
                break;
            case "draw2d.shape.node.AdditionPointObject":
                o = new draw2d.shape.node.AdditionPointObject("/img/icons/AddFalse.svg", element.id);
                break;
            case "draw2d.shape.node.SubtractionPointObject":
                o = new draw2d.shape.node.SubtractionPointObject("/img/icons/SubtractFalse.svg", element.id);
                break;
            case "draw2d.shape.node.SubtractionPointSRObject":
                o = new draw2d.shape.node.SubtractionPointSRObject("/img/icons/SubtractTrue.svg", element.id);
                break;
            case "draw2d.shape.node.MultiplicationPointObject":
                o = new draw2d.shape.node.MultiplicationPointObject("/img/icons/MultiplyFalse.svg", element.id);
                break;
            case "draw2d.shape.node.MultiplicationPointSRObject":
                o = new draw2d.shape.node.MultiplicationPointSRObject("/img/icons/MultiplyTrue.svg", element.id);
                break;
            case "draw2d.shape.node.DivisionPointObject":
                o = new draw2d.shape.node.DivisionPointObject("/img/icons/DivideFalse.svg", element.id);
                break;
            case "draw2d.shape.node.DivisionPointSRObject":
                o = new draw2d.shape.node.DivisionPointSRObject("/img/icons/DivideTrue.svg", element.id);
                break;
            case "draw2d.shape.node.ProportionalPointObject":
                o = new draw2d.shape.node.ProportionalPointObject("/img/icons/P OnlyFalse.svg", element.id);
                break;
            case "draw2d.shape.node.ProportionalReversePointObject":
                o = new draw2d.shape.node.ProportionalReversePointObject("/img/icons/P OnlyTrue.svg", element.id);
                break;
            case "draw2d.shape.node.SetPointAdjustNormalPointObject":
                o = new draw2d.shape.node.SetPointAdjustNormalPointObject("/img/icons/SetPointAdjustNormal.svg", element.id);
                break;
            case "draw2d.shape.node.SetPointAdjustReversedPointObject":
                o = new draw2d.shape.node.SetPointAdjustReversedPointObject("/img/icons/SetPointAdjustReversed.svg", element.id);
                break;
            case "draw2d.shape.node.EconomizerPointObject":
                o = new draw2d.shape.node.EconomizerPointObject("/img/icons/Economizer.svg", element.id);
                break;
            case "draw2d.shape.node.EnthalpyPointObject":
                o = new draw2d.shape.node.EnthalpyPointObject("/img/icons/Enthalpy.svg", element.id);
                break;
            case "draw2d.shape.node.EnthalpyDewPointObject":
                o = new draw2d.shape.node.EnthalpyDewPointObject("/img/icons/EnthalpyDewPoint.svg", element.id);
                break;
            case "draw2d.shape.node.EnthalpyWetBulbObject":
                o = new draw2d.shape.node.EnthalpyWetBulbObject("/img/icons/EnthalpyWetBulb.svg", element.id);
                break;
            case "draw2d.shape.node.GreaterComparatorPointObject":
                o = new draw2d.shape.node.GreaterComparatorPointObject("/img/icons/Greater.svg", element.id);
                break;
            case "draw2d.shape.node.LessComparatorPointObject":
                o = new draw2d.shape.node.LessComparatorPointObject("/img/icons/Less.svg", element.id);
                break;
            case "draw2d.shape.node.GreaterOrEqualComparatorPointObject":
                o = new draw2d.shape.node.GreaterOrEqualComparatorPointObject("/img/icons/GreaterOrEqual.svg", element.id);
                break;
            case "draw2d.shape.node.LessOrEqualComparatorPointObject":
                o = new draw2d.shape.node.LessOrEqualComparatorPointObject("/img/icons/LessOrEqual.svg", element.id);
                break;
            case "draw2d.shape.node.EqualComparatorPointObject":
                o = new draw2d.shape.node.EqualComparatorPointObject("/img/icons/Equal.svg", element.id);
                break;
            case "draw2d.shape.node.NotEqualComparatorPointObject":
                o = new draw2d.shape.node.NotEqualComparatorPointObject("/img/icons/NotEqual.svg", element.id);
                break;
            case "draw2d.shape.node.AndDigitalLogicPointObject":
                o = new draw2d.shape.node.AndDigitalLogicPointObject("/img/icons/And.svg", element.id);
                break;
            case "draw2d.shape.node.OrDigitalLogicPointObject":
                o = new draw2d.shape.node.OrDigitalLogicPointObject("/img/icons/Or.svg", element.id);
                break;
            case "draw2d.shape.node.XorDigitalLogicPointObject":
                o = new draw2d.shape.node.XorDigitalLogicPointObject("/img/icons/X-or.svg", element.id);
                break;
            case "draw2d.shape.note.ExtLabel":
                o = new draw2d.shape.note.ExtLabel(element.id);
                break;
            case "draw2d.shape.note.ExtDynamicPoint":
                o = new draw2d.shape.note.ExtDynamicPoint(element.id);
                break;
            case "draw2d.Connection":
                o = new draw2d.Connection(element.id);
                break;

            //ALARM STATUS
            //1
            case "draw2d.shape.node.AlarmStatusPointObject":
                o = new draw2d.shape.node.AlarmStatusPointObject("/img/icons/AlarmStatusfalsefalsefalsefalse.svg", element.id);
                break;
            //2
            case "draw2d.shape.node.AlarmStatusInAlarmObject":
                o = new draw2d.shape.node.AlarmStatusInAlarmObject("/img/icons/AlarmStatusInAlarm.svg", element.id);
                break;
            //3
            case "draw2d.shape.node.AlarmStatusInFaultObject":
                o = new draw2d.shape.node.AlarmStatusInFaultObject("/img/icons/AlarmStatusInAlarmInFault.svg", element.id);
                break;
            //4
            case "draw2d.shape.node.AlarmStatusInOutofServiceObject":
                o = new draw2d.shape.node.AlarmStatusInOutofServiceObject("/img/icons/AlarmStatusOutofService.svg", element.id);
                break;
            //5
            case "draw2d.shape.node.AlarmStatusInOverrideObject":
                o = new draw2d.shape.node.AlarmStatusInOverrideObject("/img/icons/AlarmStatusOverriden.svg", element.id);
                break;
            //6
            case "draw2d.shape.node.AlarmStatusInAlarmInFaultObject":
                o = new draw2d.shape.node.AlarmStatusInAlarmInFaultObject("/img/icons/AlarmStatusInAlarmInFault.svg", element.id);
                break;
            //7
            case "draw2d.shape.node.AlarmStatusInAlarmInFaultInOutofServiceObject":
                o = new draw2d.shape.node.AlarmStatusInAlarmInFaultInOutofServiceObject("/img/icons/AlarmStatusInAlarmInFaultOutOfService.svg", element.id);
                break;
            //8
            case "draw2d.shape.node.AlarmStatusAllTrueObject":
                o = new draw2d.shape.node.AlarmStatusAllTrueObject("/img/icons/AlarmStatustruetruetruetrue.svg", element.id);
                break;
            //9
            case "draw2d.shape.node.AlarmStatusInFaultInOverrideObject":
                o = new draw2d.shape.node.AlarmStatusInFaultInOverrideObject("/img/icons/AlarmStatusInFaultOverriden.svg", element.id);
                break;
            //10
            case "draw2d.shape.node.AlarmStatusInOutofServiceInOverrideObject":
                o = new draw2d.shape.node.AlarmStatusInOutofServiceInOverrideObject("/img/icons/AlarmStatusOutofServiceOverriden.svg", element.id);
                break;
            //11
            case "draw2d.shape.node.AlarmStatusInFaultInOutofServiceObject":
                o = new draw2d.shape.node.AlarmStatusInFaultInOutofServiceObject("/img/icons/AlarmStatusInFaultOutofService.svg", element.id);
                break;
            //12
            case "draw2d.shape.node.AlarmStatusInAlarmInOverrideObject":
                o = new draw2d.shape.node.AlarmStatusInAlarmInOverrideObject("/img/icons/AlarmStatusInAlarmOverriden.svg", element.id);
                break;
            //13
            case "draw2d.shape.node.AlarmStatusInAlarmInOutofServiceObject":
                o = new draw2d.shape.node.AlarmStatusInAlarmInOutofServiceObject("/img/icons/AlarmStatusInAlarmOutofService.svg", element.id);
                break;
            //14
            case "draw2d.shape.node.AlarmStatusInFaultInOutofServiceInOverrideObject":
                o = new draw2d.shape.node.AlarmStatusInFaultInOutofServiceInOverrideObject("/img/icons/AlarmStatusPointAllFalse.svg", element.id);
                break;
            //15
            case "draw2d.shape.node.AlarmStatusInAlarmInOutofServiceInOverrideObject":
                o = new draw2d.shape.node.AlarmStatusInFaultInOverrideObject("/img/icons/AlarmStatusInAlarmOutofServiceOverriden.svg", element.id);
                break;
            //16
            case "draw2d.shape.node.AlarmStatusInAlarmInFaultInOverrideObject":
                o = new draw2d.shape.node.AlarmStatusInAlarmInFaultInOverrideObject("/img/icons/AlarmStatusInAlarmInFaultOverriden.svg", element.id);
                break;



    }
    return o;
}


